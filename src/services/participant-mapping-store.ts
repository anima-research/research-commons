import { promises as fs } from 'fs';
import path from 'path';

export interface ParticipantMapping {
  source_type: 'discord' | 'slack' | 'other';
  source_user_id: string; // Discord user ID, Slack user ID, etc.
  source_username: string; // Username (@handle)
  source_display_name?: string; // Display name (server-specific nickname)
  avatar_url?: string; // Profile picture URL
  model_id?: string; // Maps to a model in our system
  is_human: boolean;
  mapped_by: string; // User ID who created the mapping
  mapped_at: Date;
  last_used_at: Date;
}

export class ParticipantMappingStore {
  private mappingsPath: string;
  private mappings: Map<string, ParticipantMapping> = new Map();

  constructor(dataPath: string) {
    this.mappingsPath = path.join(dataPath, 'participant-mappings.jsonl');
  }

  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.mappingsPath, 'utf-8');
      const lines = data.trim().split('\n').filter(l => l);
      
      for (const line of lines) {
        const mapping: ParticipantMapping = JSON.parse(line);
        // Use compound key: source_type:source_user_id
        const key = `${mapping.source_type}:${mapping.source_user_id}`;
        this.mappings.set(key, {
          ...mapping,
          mapped_at: new Date(mapping.mapped_at),
          last_used_at: new Date(mapping.last_used_at)
        });
      }
      
      console.log(`Loaded ${this.mappings.size} participant mappings`);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        // File doesn't exist yet - that's fine
        console.log('No existing participant mappings found');
      } else {
        console.error('Failed to load participant mappings:', err);
      }
    }
  }

  /**
   * Get mapping for a participant
   */
  getMapping(sourceType: string, sourceUserId: string): ParticipantMapping | null {
    const key = `${sourceType}:${sourceUserId}`;
    return this.mappings.get(key) || null;
  }

  /**
   * Save or update a mapping
   */
  async saveMapping(
    sourceType: 'discord' | 'slack' | 'other',
    sourceUserId: string,
    sourceUsername: string,
    modelId: string | undefined,
    isHuman: boolean,
    mappedBy: string,
    sourceDisplayName?: string,
    avatarUrl?: string
  ): Promise<void> {
    const key = `${sourceType}:${sourceUserId}`;
    
    const mapping: ParticipantMapping = {
      source_type: sourceType,
      source_user_id: sourceUserId,
      source_username: sourceUsername,
      source_display_name: sourceDisplayName,
      avatar_url: avatarUrl,
      model_id: modelId,
      is_human: isHuman,
      mapped_by: mappedBy,
      mapped_at: this.mappings.has(key) ? this.mappings.get(key)!.mapped_at : new Date(),
      last_used_at: new Date()
    };

    this.mappings.set(key, mapping);

    // Append to file
    await fs.appendFile(
      this.mappingsPath,
      JSON.stringify(mapping) + '\n',
      'utf-8'
    );
  }

  /**
   * Get all mappings for a source type
   */
  getMappingsBySource(sourceType: string): ParticipantMapping[] {
    return Array.from(this.mappings.values()).filter(m => m.source_type === sourceType);
  }

  /**
   * Delete a mapping
   */
  async deleteMapping(sourceType: string, sourceUserId: string): Promise<void> {
    const key = `${sourceType}:${sourceUserId}`;
    this.mappings.delete(key);
    
    // Rewrite entire file
    await this.rebuildFile();
  }

  private async rebuildFile(): Promise<void> {
    const lines = Array.from(this.mappings.values()).map(m => JSON.stringify(m));
    await fs.writeFile(this.mappingsPath, lines.join('\n') + '\n', 'utf-8');
  }
}

