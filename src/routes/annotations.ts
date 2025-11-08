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
        annotation_tags: [],
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
        selection_id: data.selection_id,
        author_id: req.userId!,
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

  // Get comments for selection
  router.get('/comments/selection/:selectionId', async (req, res) => {
    try {
      const comments = context.annotationDb.getCommentsBySelection(req.params.selectionId);
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
        selection_id: data.selection_id,
        rater_id: req.userId!,
        criterion_id: data.criterion_id,
        score: data.score,
        created_at: new Date()
      };

      // Store in SQLite
      context.annotationDb.createRating(rating);

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

  // Get ratings for selection
  router.get('/ratings/selection/:selectionId', async (req, res) => {
    try {
      const ratings = context.annotationDb.getRatingsBySelection(req.params.selectionId);
      res.json({ ratings });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete selection (and cascade to comments/ratings)
  router.delete('/selections/:selectionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const selection = context.annotationDb.getSelection(req.params.selectionId);
      if (!selection) {
        res.status(404).json({ error: 'Selection not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const canDelete = selection.created_by === req.userId! ||
                        user?.roles.includes('researcher') ||
                        user?.roles.includes('admin');

      if (!canDelete) {
        res.status(403).json({ error: 'Not authorized to delete this selection' });
        return;
      }

      context.annotationDb.deleteSelection(req.params.selectionId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete selection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete comment
  router.delete('/comments/:commentId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const comment = context.annotationDb.getComment(req.params.commentId);
      if (!comment) {
        res.status(404).json({ error: 'Comment not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const canDelete = comment.author_id === req.userId! ||
                        user?.roles.includes('researcher') ||
                        user?.roles.includes('admin');

      if (!canDelete) {
        res.status(403).json({ error: 'Not authorized to delete this comment' });
        return;
      }

      context.annotationDb.deleteComment(req.params.commentId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete comment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete rating
  router.delete('/ratings/:ratingId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const rating = context.annotationDb.getRating(req.params.ratingId);
      if (!rating) {
        res.status(404).json({ error: 'Rating not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const canDelete = rating.rater_id === req.userId! ||
                        user?.roles.includes('researcher') ||
                        user?.roles.includes('admin');

      if (!canDelete) {
        res.status(403).json({ error: 'Not authorized to delete this rating' });
        return;
      }

      context.annotationDb.deleteRating(req.params.ratingId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete rating error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

