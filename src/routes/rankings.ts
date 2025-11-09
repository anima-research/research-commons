import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { 
  CreateRankingSystemRequestSchema, 
  AttachRankingSystemRequestSchema
} from '../types/ranking.js';

export function createRankingRoutes(context: AppContext): Router {
  const router = Router();

  // List all ranking systems
  router.get('/', async (req, res) => {
    try {
      const systems = await context.rankingStore.getAllRankingSystems();
      res.json({ ranking_systems: systems });
    } catch (error) {
      console.error('List ranking systems error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get ranking system with criteria
  router.get('/:id', async (req, res) => {
    try {
      const system = await context.rankingStore.getRankingSystem(req.params.id);
      if (!system) {
        res.status(404).json({ error: 'Ranking system not found' });
        return;
      }
      
      const criteria = await context.rankingStore.getCriteriaForSystem(req.params.id);
      res.json({ ranking_system: system, criteria });
    } catch (error) {
      console.error('Get ranking system error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create ranking system (requires researcher role)
  router.post('/', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateRankingSystemRequestSchema.parse(req.body);
      
      const system = await context.rankingStore.createRankingSystem(
        data.name,
        data.description,
        data.category,
        data.permissions,
        req.userId!,
        data.criteria
      );
      
      res.status(201).json(system);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create ranking system error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update ranking system (requires researcher role + ownership or admin)
  router.put('/:id', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const system = await context.rankingStore.getRankingSystem(req.params.id);
      if (!system) {
        res.status(404).json({ error: 'Ranking system not found' });
        return;
      }

      // Check permissions
      const user = await context.userStore.getUserById(req.userId!);
      const isOwner = system.created_by === req.userId;
      const isAdmin = user?.roles.includes('admin');
      
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Not authorized to edit this ranking system' });
        return;
      }

      const data = CreateRankingSystemRequestSchema.parse(req.body);
      
      const updated = await context.rankingStore.updateRankingSystem(
        req.params.id,
        data.name,
        data.description,
        data.category,
        data.permissions,
        data.criteria
      );
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Update ranking system error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Attach ranking system to submission
  router.post('/attach', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = AttachRankingSystemRequestSchema.parse(req.body);
      
      const submissionRankingSystem = {
        id: uuidv4(),
        submission_id: data.submission_id,
        ranking_system_id: data.ranking_system_id,
        attached_by: req.userId!,
        attached_at: new Date(),
        usage_permissions: data.usage_permissions,
        is_from_topic: false
      };
      
      context.annotationDb.attachRankingSystem(submissionRankingSystem);
      
      res.status(201).json(submissionRankingSystem);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Attach ranking system error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get attached ranking systems for submission
  router.get('/submission/:submissionId', async (req, res) => {
    try {
      const systems = context.annotationDb.getSubmissionRankingSystems(req.params.submissionId);
      res.json({ ranking_systems: systems });
    } catch (error) {
      console.error('Get submission ranking systems error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Detach ranking system from submission
  router.delete('/submission/:submissionId/system/:systemId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = context.annotationDb.detachRankingSystem(
        req.params.submissionId,
        req.params.systemId
      );
      
      if (!success) {
        res.status(403).json({ error: 'Cannot detach ranking system from topic' });
        return;
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Detach ranking system error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

