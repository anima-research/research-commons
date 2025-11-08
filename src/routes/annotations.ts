import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import {
  CreateSelectionRequestSchema,
  CreateCommentRequestSchema,
  CreateRatingRequestSchema,
  Selection,
  Comment,
  Rating
} from '../types/annotation.js';

export function createAnnotationRoutes(context: AppContext): Router {
  const router = Router();

  // Create selection
  router.post('/selections', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = CreateSelectionRequestSchema.parse(req.body);

      const selection: Selection = {
        id: uuidv4(),
        submission_id: data.submission_id,
        created_by: req.userId!,
        start_message_id: data.start_message_id,
        start_offset: data.start_offset,
        end_message_id: data.end_message_id,
        end_offset: data.end_offset,
        label: data.label,
        created_at: new Date()
      };

      context.annotationDb.createSelection(selection);

      res.status(201).json(selection);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create selection error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get selections for submission
  router.get('/selections/submission/:submissionId', async (req, res) => {
    try {
      const selections = context.annotationDb.getSelectionsBySubmission(req.params.submissionId);
      res.json({ selections });
    } catch (error) {
      console.error('Get selections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create comment
  router.post('/comments', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = CreateCommentRequestSchema.parse(req.body);

      const comment: Comment = {
        id: uuidv4(),
        submission_id: data.submission_id,
        author_id: req.userId!,
        target_id: data.target_id,
        target_type: data.target_type,
        parent_id: data.parent_id,
        content: data.content,
        created_at: new Date()
      };

      context.annotationDb.createComment(comment);

      res.status(201).json(comment);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get comments for submission
  router.get('/comments/submission/:submissionId', async (req, res) => {
    try {
      const comments = context.annotationDb.getCommentsBySubmission(req.params.submissionId);
      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get comments for target
  router.get('/comments/:targetType/:targetId', async (req, res) => {
    try {
      const { targetType, targetId } = req.params;
      const comments = context.annotationDb.getCommentsByTarget(targetId, targetType);
      res.json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create rating
  router.post('/ratings', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = CreateRatingRequestSchema.parse(req.body);

      const rating: Rating = {
        id: uuidv4(),
        submission_id: data.submission_id,
        rater_id: req.userId!,
        target_id: data.target_id,
        target_type: data.target_type,
        criterion_id: data.criterion_id,
        score: data.score,
        comment_id: data.comment_id,
        created_at: new Date()
      };

      // Store in event store
      await context.submissionStore.addRating(rating);

      res.status(201).json(rating);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create rating error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get ratings for submission
  router.get('/ratings/submission/:submissionId', async (req, res) => {
    try {
      const ratings = await context.submissionStore.getRatings(req.params.submissionId);
      res.json({ ratings });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

