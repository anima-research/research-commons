import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { CreateTopicRequestSchema, CreateCriterionRequestSchema } from '../types/research.js';

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

  // Create topic (requires researcher role)
  router.post('/topics', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateTopicRequestSchema.parse(req.body);
      const topic = await context.researchStore.createTopic(
        data.name,
        data.description,
        req.userId!
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

  // Get criteria by topic
  router.get('/topics/:topicId/criteria', async (req, res) => {
    try {
      const criteria = await context.researchStore.getCriteriaByTopic(req.params.topicId);
      res.json({ criteria });
    } catch (error) {
      console.error('Get criteria error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create criterion (requires researcher role)
  router.post('/criteria', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateCriterionRequestSchema.parse(req.body);
      const criterion = await context.researchStore.createCriterion(
        data.name,
        data.description,
        data.scale_type,
        req.userId!,
        data.topic_id,
        data.scale_min,
        data.scale_max,
        data.scale_labels
      );
      res.status(201).json(criterion);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create criterion error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}

