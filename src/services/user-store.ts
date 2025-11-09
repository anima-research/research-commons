import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { EventStore } from '../storage/event-store.js';
import { User } from '../types/research.js';

/**
 * Manages user data (event-sourced)
 */
export class UserStore {
  private usersFile: EventStore;
  private users: Map<string, User> = new Map();
  private usersByEmail: Map<string, string> = new Map();
  private passwordHashes: Map<string, string> = new Map();

  constructor(dataPath: string) {
    this.usersFile = new EventStore(`${dataPath}/users.jsonl`);
  }

  async init(): Promise<void> {
    await this.usersFile.init();
    
    // Load all users
    const events = await this.usersFile.loadEvents();
    for (const event of events) {
      await this.replayEvent(event);
    }
  }

  private async replayEvent(event: any): Promise<void> {
    switch (event.type) {
      case 'user_created': {
        const { user, passwordHash } = event.data;
        const userWithDates = {
          ...user,
          created_at: new Date(user.created_at),
          updated_at: user.updated_at ? new Date(user.updated_at) : undefined
        };
        this.users.set(user.id, userWithDates);
        this.usersByEmail.set(user.email, user.id);
        if (passwordHash) {
          this.passwordHashes.set(user.email, passwordHash);
        }
        break;
      }
      case 'user_roles_updated': {
        const { userId, roles } = event.data;
        const user = this.users.get(userId);
        if (user) {
          this.users.set(userId, { ...user, roles, updated_at: event.timestamp });
        }
        break;
      }
    }
  }

  async createUser(email: string, password: string, name: string): Promise<User> {
    if (this.usersByEmail.has(email)) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: uuidv4(),
      email,
      name,
      roles: ['contributor'], // Default role
      created_at: new Date()
    };

    await this.usersFile.appendEvent({
      timestamp: new Date(),
      type: 'user_created',
      data: { user, passwordHash }
    });

    this.users.set(user.id, user);
    this.usersByEmail.set(email, user.id);
    this.passwordHashes.set(email, passwordHash);

    return user;
  }

  async validatePassword(email: string, password: string): Promise<boolean> {
    const passwordHash = this.passwordHashes.get(email);
    if (!passwordHash) return false;
    return bcrypt.compare(password, passwordHash);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const userId = this.usersByEmail.get(email);
    if (!userId) return null;
    return this.users.get(userId) || null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async updateUserRoles(userId: string, roles: User['roles']): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;

    await this.usersFile.appendEvent({
      timestamp: new Date(),
      type: 'user_roles_updated',
      data: { userId, roles }
    });

    const updated = { ...user, roles, updated_at: new Date() };
    this.users.set(userId, updated);
    return updated;
  }

  async addUserRole(userId: string, role: User['roles'][number]): Promise<User | null> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    if (!user.roles.includes(role)) {
      const newRoles = [...user.roles, role] as User['roles'];
      return this.updateUserRoles(userId, newRoles);
    }
    
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async close(): Promise<void> {
    await this.usersFile.close();
  }
}

