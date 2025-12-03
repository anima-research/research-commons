import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireAnyRole } from '../middleware/auth.js';
import { VisibilityLevel } from '../types/submission.js';

/**
 * Screening queue endpoints for reviewing pending submissions
 * Access: Researchers and Admins
 */
export function createScreeningRoutes(context: AppContext): Router {
  const router = Router();

  // All screening routes require authentication and researcher/admin role
  router.use(authenticateToken, requireAnyRole(['researcher', 'admin']));

  /**
   * GET /pending - List all pending submissions
   * Returns submissions awaiting review, newest first
   */
  router.get('/pending', async (req: AuthRequest, res) => {
    try {
      const submissions = await context.submissionStore.listPendingSubmissions();
      
      // Enhance with submitter info
      const enhanced = await Promise.all(submissions.map(async sub => {
        const submitter = await context.userStore.getUserById(sub.submitter_id);
        return {
          ...sub,
          submitter_name: submitter?.name || 'Unknown',
          submitter_email: submitter?.email || 'unknown'
        };
      }));
      
      res.json({ submissions: enhanced });
    } catch (error) {
      console.error('[Screening] List pending error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /:id/approve - Approve a pending submission
   * Body: { visibility: 'public' | 'researcher' | 'admin-only' }
   */
  router.post('/:id/approve', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { visibility } = req.body as { visibility: VisibilityLevel };
      
      // Validate visibility
      const validVisibilities: VisibilityLevel[] = ['public', 'researcher', 'admin-only'];
      if (!visibility || !validVisibilities.includes(visibility)) {
        res.status(400).json({ 
          error: 'Invalid visibility', 
          valid: validVisibilities 
        });
        return;
      }
      
      // Get submission
      const submission = await context.submissionStore.getSubmission(id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      
      // Verify it's actually pending
      if (submission.visibility !== 'pending') {
        res.status(400).json({ 
          error: 'Submission is not pending', 
          current_visibility: submission.visibility 
        });
        return;
      }
      
      // Update visibility and add screening metadata
      submission.visibility = visibility;
      submission.metadata = {
        ...submission.metadata,
        screening: {
          ...submission.metadata.screening,
          reviewed_at: new Date().toISOString(),
          reviewed_by: req.userId
        }
      };
      
      await context.submissionStore.updateSubmission(id, submission);
      
      console.log(`[Screening] Submission ${id} approved as ${visibility} by ${req.userId}`);
      
      res.json({ 
        success: true, 
        submission,
        message: `Submission approved with visibility: ${visibility}`
      });
    } catch (error) {
      console.error('[Screening] Approve error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * POST /:id/reject - Reject a pending submission
   * Body: { reason?: string }
   */
  router.post('/:id/reject', async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body as { reason?: string };
      
      // Get submission
      const submission = await context.submissionStore.getSubmission(id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      
      // Verify it's actually pending (or allow rejection of any non-public)
      if (submission.visibility === 'public') {
        res.status(400).json({ 
          error: 'Cannot reject a public submission. Use delete instead.',
          current_visibility: submission.visibility 
        });
        return;
      }
      
      // Add rejection metadata before soft-deleting
      submission.metadata = {
        ...submission.metadata,
        screening: {
          ...submission.metadata.screening,
          reviewed_at: new Date().toISOString(),
          reviewed_by: req.userId,
          rejection_reason: reason || 'No reason provided'
        }
      };
      
      // Update metadata first, then soft-delete
      await context.submissionStore.updateSubmission(id, submission);
      await context.submissionStore.deleteSubmission(id, req.userId!);
      
      console.log(`[Screening] Submission ${id} rejected by ${req.userId}: ${reason || 'No reason'}`);
      
      res.json({ 
        success: true,
        message: 'Submission rejected and removed from queue'
      });
    } catch (error) {
      console.error('[Screening] Reject error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  /**
   * GET /stats - Get screening queue statistics
   * Used for sidebar badges and dashboard
   */
  router.get('/stats', async (req: AuthRequest, res) => {
    try {
      const pending = await context.submissionStore.listPendingSubmissions();
      
      // Count approved/rejected today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get all submissions to check screening metadata
      // Note: This is a simple implementation. For larger scale, we'd use a proper query.
      const allSubmissions = await context.submissionStore.listSubmissions({
        includeDeleted: true
      });
      
      let approvedToday = 0;
      let rejectedToday = 0;
      
      for (const sub of allSubmissions) {
        const reviewedAt = sub.metadata?.screening?.reviewed_at;
        if (reviewedAt) {
          const reviewDate = new Date(reviewedAt);
          if (reviewDate >= today) {
            if (sub.deleted) {
              rejectedToday++;
            } else if (sub.visibility !== 'pending') {
              approvedToday++;
            }
          }
        }
      }
      
      res.json({
        pending_count: pending.length,
        approved_today: approvedToday,
        rejected_today: rejectedToday
      });
    } catch (error) {
      console.error('[Screening] Stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

