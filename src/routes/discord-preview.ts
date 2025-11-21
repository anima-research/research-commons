import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  lastMessageUrl: z.string(),
  limit: z.number().optional().default(50)
});

export function createDiscordPreviewRoutes(context: AppContext): Router {
  const router = Router();

  /**
   * POST /api/discord-preview/messages
   * Fetch lightweight message preview for selection
   */
  router.post('/messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = PreviewRequestSchema.parse(req.body);

      console.log('[Discord Preview] Fetching messages from:', data.lastMessageUrl);

      // Call Discord export API with minimal data
      const response = await fetch(`${context.discordConfig.apiUrl}/api/messages/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context.discordConfig.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          last: data.lastMessageUrl,
          recencyWindow: {
            messages: data.limit
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Discord API error: ${response.statusText} - ${errorText}`);
      }

      const discordData = await response.json() as any;

      // Return lightweight preview data
      const messages = discordData.messages.map((msg: any) => ({
        id: msg.id,
        discord_message_id: msg.id,
        author_name: msg.author.displayName || msg.author.username,
        author_username: msg.author.username,
        content: msg.content.substring(0, 100), // Truncate for preview
        timestamp: msg.timestamp,
        is_bot: msg.author.bot || false
      }));

      // Build message URL for each message
      const urlMatch = data.lastMessageUrl.match(/channels\/(\d+)\/(\d+)\/\d+/);
      const guildId = urlMatch?.[1];
      const channelId = urlMatch?.[2];

      const messagesWithUrls = messages.map((msg: any) => ({
        ...msg,
        message_url: `https://discord.com/channels/${guildId}/${channelId}/${msg.discord_message_id}`
      }));

      res.json({ 
        messages: messagesWithUrls,
        has_more: discordData.metadata?.truncated || false
      });
    } catch (error: any) {
      console.error('[Discord Preview] Error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch message preview', 
        message: error.message 
      });
    }
  });

  return router;
}

