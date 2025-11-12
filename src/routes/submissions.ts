import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { CreateSubmissionRequestSchema, Message } from '../types/submission.js';

export function createSubmissionRoutes(context: AppContext): Router {
  const router = Router();

  // List submissions
  router.get('/', async (req, res) => {
    try {
      const submissions = await context.submissionStore.listSubmissions();
      
      // Enhance each submission with stats and submitter name
      const submissionsWithStats = await Promise.all(submissions.map(async sub => {
        try {
          // Get selections (annotations/tags)
          const selections = context.annotationDb.getSelectionsBySubmission(sub.id);
          const tagCount = new Set(
            selections.flatMap(s => s.annotation_tags || [])
          ).size;
          
          // Get comments
          const allComments = selections.flatMap(s => 
            context.annotationDb.getCommentsBySelection(s.id)
          );
          const commentCount = allComments.length;
          
          // Get ratings
          const ratings = context.annotationDb.getRatingsBySubmission(sub.id);
          
          // Get submitter name
          const submitter = await context.userStore.getUserById(sub.submitter_id);
          const submitterName = submitter?.name || 'Unknown';
          
          return {
            ...sub,
            submitter_name: submitterName,
            stats: {
              tag_count: tagCount,
              comment_count: commentCount,
              rating_count: ratings.length
            }
          };
        } catch (err) {
          console.error('Error enhancing submission:', sub.id, err);
          return {
            ...sub,
            submitter_name: 'Unknown',
            stats: {
              tag_count: 0,
              comment_count: 0,
              rating_count: 0
            }
          };
        }
      }));
      
      res.json({ submissions: submissionsWithStats });
    } catch (error) {
      console.error('List submissions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create submission
  router.post('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const data = CreateSubmissionRequestSchema.parse(req.body);
      
      const tempSubmissionId = uuidv4();
      
      // Convert request messages to full Message objects
      const messages: Message[] = data.messages.map(msg => ({
        ...msg,
        id: msg.id || uuidv4(),
        submission_id: tempSubmissionId,
        timestamp: msg.timestamp || new Date()
      }));

      // Create submission
      const submission = await context.submissionStore.createSubmission(
        req.userId!,
        data.title,
        data.source_type,
        messages,
        data.metadata as any,
        data.arc_conversation_id ? {
          arc_conversation_id: data.arc_conversation_id
          // TODO: Fetch certification from ARC API
        } : undefined
      );

      // Don't attach anything at creation - will be dynamically looked up from topics
      // Only public ontologies/ranking systems get attached (for submissions without topics)
      const topicTags = (data.metadata as any)?.tags || [];
      
      if (topicTags.length === 0) {
        // No topics - attach all public systems as convenience
        const allOntologies = await context.ontologyStore.getAllOntologies();
        for (const ontology of allOntologies.filter(o => o.permissions === 'public')) {
          try {
            const { v4: uuidv4 } = await import('uuid');
            context.annotationDb.attachOntology({
              id: uuidv4(),
              submission_id: submission.id,
              ontology_id: ontology.id,
              attached_by: req.userId!,
              attached_at: new Date(),
              usage_permissions: 'anyone',
              is_default: false
            });
          } catch (err) {
            console.error('Failed to attach ontology:', ontology.name, err);
          }
        }

        const allRankingSystems = await context.rankingStore.getAllRankingSystems();
        for (const system of allRankingSystems.filter(s => s.permissions === 'public')) {
          try {
            const { v4: uuidv4 } = await import('uuid');
            context.annotationDb.attachRankingSystem({
              id: uuidv4(),
              submission_id: submission.id,
              ranking_system_id: system.id,
              attached_by: req.userId!,
              attached_at: new Date(),
              usage_permissions: 'anyone',
              is_from_topic: false
            });
          } catch (err) {
            console.error('Failed to attach ranking system:', system.name, err);
          }
        }
      }

      res.status(201).json(submission);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else if (error.message.includes('tree')) {
        res.status(400).json({ error: error.message });
      } else {
        console.error('Submission creation error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get submission
  router.get('/:submissionId', async (req, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      res.json(submission);
    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update submission metadata
  router.patch('/:submissionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check permissions
      const user = await context.userStore.getUserById(req.userId!);
      const canEdit = submission.submitter_id === req.userId! || 
                      user?.roles.includes('researcher') ||
                      user?.roles.includes('admin');
      
      if (!canEdit) {
        res.status(403).json({ error: 'Not authorized to edit this submission' });
        return;
      }

      const oldTags = submission.metadata.tags || [];
      
      // Update metadata
      if (req.body.description !== undefined) {
        submission.metadata.description = req.body.description;
      }
      if (req.body.tags !== undefined) {
        submission.metadata.tags = req.body.tags;
      }

      await context.submissionStore.updateSubmission(req.params.submissionId, submission);

      // Don't attach on tag change - will be dynamically looked up from topics

      res.json(submission);
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get submission messages
  router.get('/:submissionId/messages', async (req, res) => {
    try {
      const messages = await context.submissionStore.getMessages(req.params.submissionId);
      
      if (messages.length === 0) {
        // Check if submission exists
        const submission = await context.submissionStore.getSubmission(req.params.submissionId);
        if (!submission) {
          res.status(404).json({ error: 'Submission not found' });
          return;
        }
      }

      res.json({ messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all selections for submission (with their tags, comments, ratings)
  router.get('/:submissionId/selections', async (req, res) => {
    try {
      const selections = context.annotationDb.getSelectionsBySubmission(req.params.submissionId);
      
      // Populate each selection with its tags
      const selectionsWithData = selections.map(sel => {
        const tags = context.annotationDb.getTagsForSelection(sel.id);
        return { ...sel, annotation_tags: tags };
      });
      
      res.json({ selections: selectionsWithData });
    } catch (error) {
      console.error('Get selections error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete submission (soft delete - mark as deleted)
  router.delete('/:submissionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const canDelete = submission.submitter_id === req.userId! ||
                        user?.roles.includes('admin');

      if (!canDelete) {
        res.status(403).json({ error: 'Not authorized to delete this submission' });
        return;
      }

      await context.submissionStore.deleteSubmission(req.params.submissionId, req.userId!);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Delete submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

