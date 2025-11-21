import { BaseImporter, ImportSource, ImportedConversation } from './base-importer.js';
import type { Message } from '../types/submission.js';
import { v4 as uuidv4 } from 'uuid';

interface DiscordMessage {
  id: string;
  author: {
    id: string;
    username: string;
    displayName?: string;
    bot?: boolean;
  };
  content: string;
  timestamp: string;
  reactions?: Array<{
    emoji: string;
    count: number;
  }>;
  attachments?: Array<{
    id?: string;
    url?: string;
    filename?: string;
    contentType?: string;
    mediaType?: string;
    data?: string; // base64 encoded image data
    size?: number;
  }>;
  referencedMessageId?: string;
}

interface DiscordExportData {
  messages: DiscordMessage[];
  metadata: {
    channelId: string;
    guildId?: string;
    firstMessageId: string;
    lastMessageId: string;
    totalCount: number;
    truncated: boolean;
  };
}

export interface DiscordImportParams {
  lastMessageUrl: string;
  firstMessageUrl?: string;
  maxMessages?: number;
}

export class DiscordImporter extends BaseImporter {
  async importConversation(source: ImportSource): Promise<ImportedConversation> {
    if (source.type !== 'discord') {
      throw new Error('Invalid source type for Discord importer');
    }

    // Source.identifier contains JSON-encoded import params
    const params: DiscordImportParams = JSON.parse(source.identifier);

    // Build request body
    const requestBody: any = {
      last: params.lastMessageUrl
    };

    if (params.firstMessageUrl) {
      requestBody.first = params.firstMessageUrl;
    }

    if (params.maxMessages) {
      requestBody.recencyWindow = {
        messages: params.maxMessages
      };
    }

    // Fetch messages from Discord export API
    const response = await fetch(`${this.config.apiUrl}/api/messages/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch Discord messages: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json() as DiscordExportData;

    // Extract guild ID from message URL for fetching user info
    const channelInfo = params.lastMessageUrl.match(/channels\/(\d+)\/(\d+)\/\d+/);
    const guildId = channelInfo?.[1];
    
    // Track unique participants with their Discord IDs - key by user ID for easy updates
    const participantInfo = new Map<string, { 
      discordUserId: string; 
      username: string;
      displayName: string;
      isBot: boolean;
      avatarUrl?: string;
    }>();
    
    // First pass: collect unique participants
    for (const msg of data.messages) {
      const userId = msg.author.id;
      
      if (!participantInfo.has(userId)) {
        participantInfo.set(userId, {
          discordUserId: userId,
          username: msg.author.username,
          displayName: msg.author.displayName || msg.author.username,
          isBot: msg.author.bot || false
        });
      }
    }
    
    // Fetch user info including avatars for all participants
    for (const [userId, info] of participantInfo.entries()) {
      try {
        const userUrl = guildId 
          ? `${this.config.apiUrl}/api/users/${info.discordUserId}?guildId=${guildId}`
          : `${this.config.apiUrl}/api/users/${info.discordUserId}`;
        
        const userResponse = await fetch(userUrl, {
          headers: {
            'Authorization': `Bearer ${this.config.apiToken}`
          }
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json() as any;
          info.avatarUrl = userData.avatarUrl;
          
          // Update display name from guild-specific info if available
          if (userData.displayName && userData.displayName !== userData.username) {
            info.displayName = userData.displayName;
          }
        }
      } catch (err) {
        console.error(`[Discord Import] Failed to fetch user info for user ${userId}:`, err);
        // Continue without avatar
      }
    }
    
    // Convert Discord messages to our format, chaining them into a linked list
    const messages: Message[] = [];
    let previousMessageId: string | null = null;
    
    for (let index = 0; index < data.messages.length; index++) {
      const msg = data.messages[index];
      const messageId = uuidv4();
      
      // Get participant data by user ID (has updated display name from API)
      const participantData = participantInfo.get(msg.author.id);
      const displayName = participantData?.displayName || msg.author.displayName || msg.author.username;
      
      const contentBlocks: any[] = [];
      
      // Add text content if present
      if (msg.content) {
        contentBlocks.push({
          type: 'text' as const,
          text: msg.content
        });
      }
      
      // Add attachments
      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments) {
          // Check if it's an image by mediaType or contentType
          const mediaType = attachment.mediaType || attachment.contentType;
          const isImage = mediaType?.startsWith('image/');
          
          if (isImage) {
            if (attachment.data) {
              // Base64 encoded image
              contentBlocks.push({
                type: 'image' as const,
                mime_type: mediaType,
                data: attachment.data
              });
            } else if (attachment.url) {
              // Image URL from CDN - embed as markdown
              contentBlocks.push({
                type: 'text' as const,
                text: `![Discord Image](${attachment.url})`
              });
            }
          } else if (attachment.url) {
            // Non-image attachment - show as link
            contentBlocks.push({
              type: 'text' as const,
              text: `[Attachment: ${attachment.filename || 'file'}](${attachment.url})`
            });
          }
        }
      }
      
      messages.push({
        id: messageId,
        submission_id: '', // Will be filled by submission store
        parent_message_id: previousMessageId, // Chain to previous message (null for first)
        order: index,
        participant_name: displayName,
        participant_type: msg.author.bot ? 'model' : 'human',
        content_blocks: contentBlocks.length > 0 ? contentBlocks : [{ type: 'text' as const, text: '' }],
        timestamp: new Date(msg.timestamp),
        model_info: msg.author.bot ? {
          model_id: msg.author.username,
          provider: 'discord-bot',
          reasoning_enabled: false
        } : undefined,
        metadata: {
          discord_message_id: msg.id,
          discord_user_id: msg.author.id,
          discord_username: participantData?.username || msg.author.username,
          avatar_url: participantData?.avatarUrl
        }
      });
      
      previousMessageId = messageId;
    }
    
    // Build participant info for frontend to use in mapping
    const participants_with_ids = Array.from(participantInfo.entries()).map(([userId, info]) => ({
      name: info.displayName, // Use display name as the key for mapping
      discord_user_id: info.discordUserId,
      username: info.username,
      display_name: info.displayName,
      is_bot: info.isBot,
      avatar_url: info.avatarUrl
    }));

    // Extract unique participants and models from our updated participantInfo
    const participants = Array.from(participantInfo.values()).map(p => p.displayName);
    const models = Array.from(participantInfo.values())
      .filter(p => p.isBot)
      .map(p => p.username);

    // Use channel info extracted earlier (no redeclaration)
    const channelId = channelInfo?.[2] || data.metadata.channelId;

    return {
      title: `Discord: Channel ${channelId}`,
      messages,
      metadata: {
        original_date: data.messages.length > 0 ? new Date(data.messages[0].timestamp) : undefined,
        participants_summary: participants,
        model_summary: models.length > 0 ? models : undefined,
        source_identifier: channelId,
        channel_id: channelId,
        guild_id: guildId,
        message_count: data.messages.length,
        truncated: data.metadata.truncated,
        participants_with_ids // Include Discord user IDs for mapping
      },
      source_type: 'discord'
    };
  }

  async validateConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`
        }
      });
      return response.ok;
    } catch (err) {
      console.error('Discord connection validation failed:', err);
      return false;
    }
  }

  getDisplayName(): string {
    return 'Discord';
  }
}

