import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { DiscordImporter } from '../importers/discord-importer.js';
import { ImportSource } from '../importers/base-importer.js';
import { z } from 'zod';

const ImportRequestSchema = z.object({
  source_type: z.enum(['discord']),
  discord_params: z.object({
    lastMessageUrl: z.string(),
    firstMessageUrl: z.string().optional(),
    maxMessages: z.number().optional()
  }).optional(),
  topic_tags: z.array(z.string()).optional()
});

export function createImportRoutes(context: AppContext): Router {
  const router = Router();

  /**
   * POST /api/imports/discord/fetch
   * Fetch Discord messages for preview/configuration (doesn't create submission)
   */
  router.post('/discord/fetch', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = ImportRequestSchema.parse(req.body);

      if (data.source_type !== 'discord') {
        res.status(400).json({ error: 'Invalid source type for Discord import' });
        return;
      }

      if (!data.discord_params) {
        res.status(400).json({ error: 'discord_params required for Discord import' });
        return;
      }

      // Create Discord importer with server-side config
      const importer = new DiscordImporter(context.discordConfig);

      // Import conversation data (but don't create submission yet)
      const source: ImportSource = {
        type: 'discord',
        identifier: JSON.stringify(data.discord_params)
      };

      console.log(`[Import] Fetching Discord messages with params:`, data.discord_params);
      const imported = await importer.importConversation(source);

      // Check for existing participant mappings - key by Discord user ID
      const participantsWithIds = (imported.metadata as any).participants_with_ids || [];
      const existingMappingsByUserId: any = {};
      
      for (const participant of participantsWithIds) {
        const mapping = context.participantMappingStore.getMapping('discord', participant.discord_user_id);
        if (mapping) {
          existingMappingsByUserId[participant.discord_user_id] = {
            model_id: mapping.model_id,
            is_human: mapping.is_human,
            last_used: mapping.last_used_at,
            avatar_url: mapping.avatar_url
          };
          console.log(`[Import] Found mapping for Discord user ${participant.discord_user_id} (${participant.name}):`, mapping.model_id || 'human');
        }
      }

      // Return messages for preview/configuration
      res.json({
        messages: imported.messages,
        title: imported.title,
        metadata: imported.metadata,
        existing_mappings_by_user_id: existingMappingsByUserId
      });
    } catch (error: any) {
      console.error('[Import] Discord fetch error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        res.status(500).json({ 
          error: 'Fetch failed', 
          message: error.message 
        });
      }
    }
  });

  /**
   * POST /api/imports/discord
   * Import a conversation from Discord (creates submission)
   */
  router.post('/discord', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = ImportRequestSchema.parse(req.body);

      if (data.source_type !== 'discord') {
        res.status(400).json({ error: 'Invalid source type for Discord import' });
        return;
      }

      // Import conversation
      if (!data.discord_params) {
        res.status(400).json({ error: 'discord_params required for Discord import' });
        return;
      }

      // Create Discord importer with server-side config
      const importer = new DiscordImporter(context.discordConfig);

      const source: ImportSource = {
        type: 'discord',
        identifier: JSON.stringify(data.discord_params)
      };

      console.log(`[Import] Starting Discord import with params:`, data.discord_params);
      const imported = await importer.importConversation(source);

      // Create submission
      const submission = await context.submissionStore.createSubmission(
        req.userId!,
        imported.title,
        imported.source_type,
        imported.messages,
        {
          ...imported.metadata,
          tags: data.topic_tags || []
        },
        imported.certification_data
      );

      console.log(`[Import] Successfully imported Discord conversation: ${submission.id}`);

      res.status(201).json({
        submission_id: submission.id,
        message_count: imported.messages.length,
        title: imported.title
      });
    } catch (error: any) {
      console.error('[Import] Discord import error:', error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        res.status(500).json({ 
          error: 'Import failed', 
          message: error.message 
        });
      }
    }
  });

  /**
   * POST /api/imports/save-mappings
   * Save participant mappings for future imports
   */
  router.post('/save-mappings', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { source_type, mappings } = req.body;
      
      if (!source_type || !mappings || !Array.isArray(mappings)) {
        res.status(400).json({ error: 'Invalid request - source_type and mappings array required' });
        return;
      }

      // Save each mapping
      for (const mapping of mappings) {
        await context.participantMappingStore.saveMapping(
          source_type,
          mapping.source_user_id,
          mapping.source_username,
          mapping.model_id,
          mapping.is_human,
          req.userId!,
          mapping.source_display_name,
          mapping.avatar_url
        );
      }

      console.log(`[Import] Saved ${mappings.length} participant mappings`);
      res.json({ success: true, count: mappings.length });
    } catch (error: any) {
      console.error('[Import] Save mappings error:', error);
      res.status(500).json({ error: 'Failed to save mappings', message: error.message });
    }
  });

  /**
   * GET /api/imports/discord/status
   * Check if Discord import is configured and available
   */
  router.get('/discord/status', async (req, res) => {
    try {
      const importer = new DiscordImporter(context.discordConfig);
      const isValid = await importer.validateConnection();
      
      res.json({ 
        available: isValid,
        configured: !!context.discordConfig.apiUrl 
      });
    } catch (error: any) {
      console.error('[Import] Discord status check error:', error);
      res.json({ available: false, configured: false });
    }
  });

  return router;
}

