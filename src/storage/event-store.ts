import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export interface Event {
  timestamp: Date;
  type: string;
  data: any;
}

/**
 * Append-only JSONL event store
 */
export class EventStore {
  private filePath: string;
  private writeHandle: fs.FileHandle | null = null;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async init(): Promise<void> {
    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Open file for appending
    this.writeHandle = await fs.open(this.filePath, 'a');
  }

  async appendEvent(event: Event): Promise<void> {
    if (!this.writeHandle) {
      throw new Error('EventStore not initialized');
    }

    const line = JSON.stringify({
      ...event,
      timestamp: event.timestamp.toISOString()
    }) + '\n';

    await this.writeHandle.write(line);
    await this.writeHandle.sync();
  }

  async loadEvents(): Promise<Event[]> {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      if (!content.trim()) return [];

      return content
        .trim()
        .split('\n')
        .map(line => {
          const event = JSON.parse(line);
          return {
            ...event,
            timestamp: new Date(event.timestamp)
          };
        });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.writeHandle) {
      await this.writeHandle.close();
      this.writeHandle = null;
    }
  }
}

/**
 * Manages event stores sharded by ID (e.g., by submission)
 */
export class ShardedEventStore {
  private basePath: string;
  private stores: Map<string, EventStore> = new Map();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private getShardPath(id: string, filename: string): string {
    // Shard by first 2 chars of UUID
    const shard = id.substring(0, 2);
    return path.join(this.basePath, shard, id, filename);
  }

  async getStore(id: string, filename: string): Promise<EventStore> {
    const key = `${id}:${filename}`;
    
    if (!this.stores.has(key)) {
      const store = new EventStore(this.getShardPath(id, filename));
      await store.init();
      this.stores.set(key, store);
    }

    return this.stores.get(key)!;
  }

  async appendEvent(id: string, filename: string, event: Event): Promise<void> {
    const store = await this.getStore(id, filename);
    await store.appendEvent(event);
  }

  async loadEvents(id: string, filename: string): Promise<Event[]> {
    const store = await this.getStore(id, filename);
    return await store.loadEvents();
  }

  async closeAll(): Promise<void> {
    await Promise.all(
      Array.from(this.stores.values()).map(store => store.close())
    );
    this.stores.clear();
  }
}

