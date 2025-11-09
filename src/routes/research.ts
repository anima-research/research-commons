import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { CreateTopicRequestSchema, CreateCriterionRequestSchema, Topic } from '../types/research.js';

export function createResearchRoutes(context: AppContext): Router {
  const router = Router();

  // Get all topics
  router.get('/topics', async (req, res) => {
    try {
      const topics = await context.researchStore.getAllTopics();
      res.json({ topics });
    } catch (error) {
      console.error('Get topics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get topic by ID
  router.get('/topics/:id', async (req, res) => {
    try {
      const topic = await context.researchStore.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ error: 'Topic not found' });
        return;
      }
      res.json(topic);
    } catch (error) {
      console.error('Get topic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create topic (requires researcher role)
  router.post('/topics', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateTopicRequestSchema.parse(req.body);
      const topic = await context.researchStore.createTopic(
        data.name,
        data.description,
        req.userId!,
        data.default_ontologies || [],
        data.default_ranking_systems || []
      );
      res.status(201).json(topic);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create topic error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update topic (requires researcher role)
  router.patch('/topics/:id', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const topic = await context.researchStore.getTopic(req.params.id);
      if (!topic) {
        res.status(404).json({ error: 'Topic not found' });
        return;
      }

      const updates: Partial<Topic> = {};
      if (req.body.name !== undefined) updates.name = req.body.name;
      if (req.body.description !== undefined) updates.description = req.body.description;
      if (req.body.default_ontologies !== undefined) updates.default_ontologies = req.body.default_ontologies;

      const updated = await context.researchStore.updateTopic(req.params.id, updates);
      res.json(updated);
    } catch (error: any) {
      console.error('Update topic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete topic (requires researcher role)
  router.delete('/topics/:id', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const deleted = await context.researchStore.deleteTopic(req.params.id);
      if (!deleted) {
        res.status(404).json({ error: 'Topic not found' });
        return;
      }
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete topic error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all criteria
  router.get('/criteria', async (req, res) => {
    try {
      const criteria = await context.researchStore.getAllCriteria();
      res.json({ criteria });
    } catch (error) {
      console.error('Get criteria error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Criteria routes deprecated - use /api/rankings instead
  // Kept for backward compatibility

  return router;
}

