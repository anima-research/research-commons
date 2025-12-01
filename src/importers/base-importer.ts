/**
 * Base interface for conversation importers
 * All importers (Discord, Slack, ARC, etc.) should implement this interface
 */

import type { Message } from '../types/submission.js';

export interface ImportSource {
  type: 'discord' | 'slack' | 'arc' | 'other';
  identifier: string; // channel ID, thread ID, conversation ID, etc.
}

export interface ImportedConversation {
  title: string;
  messages: Message[];
  metadata: {
    original_date?: Date;
    participants_summary?: string[];
    model_summary?: string[];
    source_identifier?: string;
    tags?: string[];
    [key: string]: any;
  };
  source_type: 'arc-certified' | 'json-upload' | 'discord' | 'other';
  certification_data?: {
    arc_conversation_id?: string;
    signature_hash?: string;
    verified_at?: Date;
  };
}

export interface ImporterConfig {
  apiUrl: string;
  apiToken?: string;
  [key: string]: any;
}

export abstract class BaseImporter {
  protected config: ImporterConfig;

  constructor(config: ImporterConfig) {
    this.config = config;
  }

  /**
   * Fetch and convert a conversation from the external source
   */
  abstract importConversation(source: ImportSource): Promise<ImportedConversation>;

  /**
   * Validate that the source is accessible and credentials work
   */
  abstract validateConnection(): Promise<boolean>;

  /**
   * Get display name for this importer
   */
  abstract getDisplayName(): string;
}


