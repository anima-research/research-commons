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
      res.json({ submissions });
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

  // Get submission ratings
  router.get('/:submissionId/ratings', async (req, res) => {
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

