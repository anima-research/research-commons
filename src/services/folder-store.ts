import { v4 as uuidv4 } from 'uuid';
import { EventStore } from '../storage/event-store.js';
import { Folder, FolderVisibility } from '../types/folder.js';

/**
 * Manages folders (event-sourced)
 *
 * Folder membership and submission relationships are stored in SQLite
 * via AnnotationDatabase for efficient querying.
 */
export class FolderStore {
  private foldersFile: EventStore;
  private folders: Map<string, Folder> = new Map();

  constructor(dataPath: string) {
    this.foldersFile = new EventStore(`${dataPath}/folders.jsonl`);
  }

  async init(): Promise<void> {
    await this.foldersFile.init();

    const events = await this.foldersFile.loadEvents();
    for (const event of events) {
      if (event.type === 'folder_created') {
        const folder: Folder = {
          ...event.data,
          created_at: new Date(event.data.created_at)
        };
        this.folders.set(folder.id, folder);
      } else if (event.type === 'folder_updated') {
        const folder = this.folders.get(event.data.id);
        if (folder) {
          this.folders.set(event.data.id, { ...folder, ...event.data.updates });
        }
      } else if (event.type === 'folder_deleted') {
        this.folders.delete(event.data.id);
      }
    }
  }

  async createFolder(
    name: string,
    createdBy: string,
    visibility: FolderVisibility = 'private',
    options: {
      description?: string;
      required_role?: string;
      color?: string;
    } = {}
  ): Promise<Folder> {
    const folder: Folder = {
      id: uuidv4(),
      name,
      description: options.description,
      created_by: createdBy,
      created_at: new Date(),
      visibility,
      required_role: options.required_role,
      color: options.color
    };

    await this.foldersFile.appendEvent({
      timestamp: new Date(),
      type: 'folder_created',
      data: folder
    });

    this.folders.set(folder.id, folder);
    return folder;
  }

  async getFolder(id: string): Promise<Folder | null> {
    return this.folders.get(id) || null;
  }

  async getAllFolders(): Promise<Folder[]> {
    return Array.from(this.folders.values());
  }

  async getFoldersByOwner(userId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(f => f.created_by === userId);
  }

  async updateFolder(id: string, updates: Partial<Folder>): Promise<Folder | null> {
    const folder = this.folders.get(id);
    if (!folder) return null;

    // Don't allow changing id, created_by, created_at
    const { id: _, created_by: __, created_at: ___, ...safeUpdates } = updates;

    const updated = { ...folder, ...safeUpdates };

    await this.foldersFile.appendEvent({
      timestamp: new Date(),
      type: 'folder_updated',
      data: { id, updates: safeUpdates }
    });

    this.folders.set(id, updated);
    return updated;
  }

  async deleteFolder(id: string): Promise<boolean> {
    if (!this.folders.has(id)) return false;

    await this.foldersFile.appendEvent({
      timestamp: new Date(),
      type: 'folder_deleted',
      data: { id }
    });

    this.folders.delete(id);
    return true;
  }

  async close(): Promise<void> {
    await this.foldersFile.close();
  }
}
