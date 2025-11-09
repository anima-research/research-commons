import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { 
  CreateOntologyRequestSchema, 
  AttachOntologyRequestSchema,
  ApplyTagsRequestSchema 
} from '../types/ontology.js';

export function createOntologyRoutes(context: AppContext): Router {
  const router = Router();

  // List all ontologies
  router.get('/', async (req, res) => {
    try {
      const ontologies = await context.ontologyStore.getAllOntologies();
      res.json({ ontologies });
    } catch (error) {
      console.error('List ontologies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get ontology with tags
  router.get('/:id', async (req, res) => {
    try {
      const ontology = await context.ontologyStore.getOntology(req.params.id);
      if (!ontology) {
        res.status(404).json({ error: 'Ontology not found' });
        return;
      }
      
      const tags = await context.ontologyStore.getTagsForOntology(req.params.id);
      res.json({ ontology, tags });
    } catch (error) {
      console.error('Get ontology error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create ontology (requires researcher role)
  router.post('/', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateOntologyRequestSchema.parse(req.body);
      
      const ontology = await context.ontologyStore.createOntology(
        data.name,
        data.description,
        data.category,
        data.permissions,
        req.userId!,
        data.tags
      );
      
      res.status(201).json(ontology);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create ontology error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update ontology (requires researcher role + ownership or admin)
  router.put('/:id', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const ontology = await context.ontologyStore.getOntology(req.params.id);
      if (!ontology) {
        res.status(404).json({ error: 'Ontology not found' });
        return;
      }

      // Check permissions
      const user = await context.userStore.getUserById(req.userId!);
      const isOwner = ontology.created_by === req.userId;
      const isAdmin = user?.roles.includes('admin');
      
      if (!isOwner && !isAdmin) {
        res.status(403).json({ error: 'Not authorized to edit this ontology' });
        return;
      }

      const data = CreateOntologyRequestSchema.parse(req.body);
      
      const updated = await context.ontologyStore.updateOntology(
        req.params.id,
        data.name,
        data.description,
        data.category,
        data.permissions,
        data.tags
      );
      
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Update ontology error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Attach ontology to submission
  router.post('/attach', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = AttachOntologyRequestSchema.parse(req.body);
      
      const submissionOntology = {
        id: uuidv4(),
        submission_id: data.submission_id,
        ontology_id: data.ontology_id,
        attached_by: req.userId!,
        attached_at: new Date(),
        usage_permissions: data.usage_permissions,
        is_default: false
      };
      
      context.annotationDb.attachOntology(submissionOntology);
      
      res.status(201).json(submissionOntology);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Attach ontology error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get attached ontologies for submission
  router.get('/submission/:submissionId', async (req, res) => {
    try {
      const ontologies = context.annotationDb.getSubmissionOntologies(req.params.submissionId);
      res.json({ ontologies });
    } catch (error) {
      console.error('Get submission ontologies error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Apply tags to selection
  router.post('/tags/apply', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = ApplyTagsRequestSchema.parse(req.body);
      
      context.annotationDb.applyTags(data.selection_id, data.tag_ids, req.userId!);
      
      res.status(200).json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Apply tags error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}

