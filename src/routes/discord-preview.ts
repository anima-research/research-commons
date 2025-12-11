import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const PreviewRequestSchema = z.object({
  lastMessageUrl: z.string(),
  firstMessageUrl: z.string().optional(),
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
      // Check if Discord config is available
      if (!context.discordConfig.apiUrl || !context.discordConfig.apiToken) {
        res.status(503).json({ 
          error: 'Discord import not configured', 
          message: 'DISCORD_API_URL and DISCORD_API_TOKEN environment variables must be set' 
        });
        return;
      }

      const data = PreviewRequestSchema.parse(req.body);

      console.log('[Discord Preview] Fetching messages from:', data.lastMessageUrl, 'to:', data.firstMessageUrl);
      console.log('[Discord Preview] Using Discord API:', context.discordConfig.apiUrl);

      // Build request body - support both range queries and recency window
      const requestBody: any = {
        last: data.lastMessageUrl
      };
      
      // Add first message URL if provided (for range queries)
      if (data.firstMessageUrl) {
        requestBody.first = data.firstMessageUrl;
      } else {
        // Use recency window for open-ended queries
        requestBody.recencyWindow = {
          messages: data.limit
        };
      }

      // Call Discord export API with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        response = await fetch(`${context.discordConfig.apiUrl}/api/messages/export`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${context.discordConfig.apiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        console.error('[Discord Preview] Fetch error details:', {
          name: fetchError.name,
          message: fetchError.message,
          cause: fetchError.cause,
          url: `${context.discordConfig.apiUrl}/api/messages/export`
        });
        if (fetchError.name === 'AbortError') {
          throw new Error('Discord API request timed out after 30 seconds. The Discord bridge service may be temporarily unavailable.');
        }
        throw new Error(`Discord API connection failed: ${fetchError.message} (URL: ${context.discordConfig.apiUrl})`);
      } finally {
        clearTimeout(timeoutId);
      }

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

