import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireAnyRole } from '../middleware/auth.js';
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

  // ============================================================================
  // ANNOTATION PERMISSIONS MODEL (as of 2025-11-21)
  // ============================================================================
  // 
  // SELECTIONS, TAGS, COMMENTS: Open to ANY authenticated user (including contributors)
  //   - Rationale: These are collaborative contributions, not formal evaluations
  //   - Tags use voting system, so multiple users can apply same tag
  //   - Comments are community discussion
  //   - Selections are the foundation for both
  // 
  // RATINGS: Restricted to 'rater', 'expert', 'researcher', 'agent', 'admin'
  //   - Rationale: Ratings are formal numerical evaluations against criteria
  //   - Requires understanding of rating systems and criteria
  //   - "Rater" role exists specifically for this purpose
  // 
  // This model may be refined based on usage patterns and manager guidance.
  // If changing permissions, update this comment to explain the new model.
  // ============================================================================

  // Create selection (open to all authenticated users)
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

  // Get selections for submission (with tag attributions)
  router.get('/selections/submission/:submissionId', async (req, res) => {
    try {
      const selections = context.annotationDb.getSelectionsBySubmission(req.params.submissionId);
      
      // Add tag attributions to each selection
      const selectionsWithAttributions = selections.map(sel => ({
        ...sel,
        tag_attributions: context.annotationDb.getTagAttributions(sel.id)
      }));
      
      res.json({ selections: selectionsWithAttributions });
    } catch (error) {
      console.error('Get selections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create comment (open to all authenticated users)
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

  // Create rating (restricted to rater+ roles - formal evaluation)
  router.post('/ratings', authenticateToken, requireAnyRole(['rater', 'expert', 'researcher', 'agent', 'admin']), async (req: AuthRequest, res) => {
    try {
      const data = CreateRatingRequestSchema.parse(req.body);

      const rating: Rating = {
        id: uuidv4(),
        submission_id: data.submission_id,
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

  // Get ratings for submission
  router.get('/ratings/submission/:submissionId', async (req, res) => {
    try {
      const ratings = context.annotationDb.getRatingsBySubmission(req.params.submissionId);
      res.json({ ratings });
    } catch (error) {
      console.error('Get ratings error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete selection (collaborative deletion rules)
  router.delete('/selections/:selectionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const selection = context.annotationDb.getSelection(req.params.selectionId);
      if (!selection) {
        res.status(404).json({ error: 'Selection not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      
      // Admins and researchers can always delete
      if (user?.roles.includes('admin') || user?.roles.includes('researcher')) {
        context.annotationDb.deleteSelection(req.params.selectionId);
        res.status(200).json({ success: true });
        return;
      }

      // Regular users: check collaborative deletion rules
      const { canDelete, reason } = context.annotationDb.canDeleteSelection(req.params.selectionId, req.userId!);
      
      if (!canDelete) {
        res.status(403).json({ error: reason || 'Not authorized to delete this selection' });
        return;
      }

      context.annotationDb.deleteSelection(req.params.selectionId);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete selection error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove tag from selection (removes your vote only)
  router.delete('/selections/:selectionId/tags/:tagId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const selection = context.annotationDb.getSelection(req.params.selectionId);
      if (!selection) {
        res.status(404).json({ error: 'Selection not found' });
        return;
      }

      // Check if user has voted for this tag or is moderator
      const attributions = context.annotationDb.getTagAttributions(req.params.selectionId);
      const userVote = attributions.find(a => a.tag_id === req.params.tagId && a.tagged_by === req.userId);
      
      const user = await context.userStore.getUserById(req.userId!);
      const isModerator = user?.roles.includes('researcher') || user?.roles.includes('admin');
      
      if (!isModerator && !userVote) {
        res.status(403).json({ error: 'You have not voted for this tag' });
        return;
      }

      // Remove only this user's vote
      context.annotationDb.removeTag(req.params.selectionId, req.params.tagId, req.userId!);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Remove tag error:', error);
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

  // Delete rating (deletes all ratings by this rater for this criterion)
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

