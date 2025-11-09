import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { CreateModelRequestSchema } from '../types/model.js';

export function createModelRoutes(context: AppContext): Router {
  const router = Router();

  // List all models
  router.get('/', async (req, res) => {
    try {
      const models = await context.modelStore.getAllModels();
      res.json({ models });
    } catch (error) {
      console.error('List models error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get model by ID
  router.get('/:id', async (req, res) => {
    try {
      const model = await context.modelStore.getModel(req.params.id);
      if (!model) {
        res.status(404).json({ error: 'Model not found' });
        return;
      }
      res.json({ model });
    } catch (error) {
      console.error('Get model error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create model (requires researcher or admin)
  router.post('/', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateModelRequestSchema.parse(req.body);
      
      const model = await context.modelStore.createModel(
        data.name,
        data.description,
        data.provider,
        data.model_id,
        data.avatar,
        data.color,
        req.userId!
      );
      
      res.status(201).json(model);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create model error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update model (requires researcher/admin + ownership)
  router.put('/:id', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const model = await context.modelStore.getModel(req.params.id);
      if (!model) {
        res.status(404).json({ error: 'Model not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const isOwner = model.created_by === req.userId;
      const isAdmin = user?.roles.includes('admin');
      
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Not authorized to edit this model' });
        return;
      }

      const data = CreateModelRequestSchema.parse(req.body);
      const updated = await context.modelStore.updateModel(req.params.id, data);
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Update model error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete model (requires admin)
  router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      await context.modelStore.deleteModel(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete model error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

