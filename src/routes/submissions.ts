import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, JWT_SECRET, optionalAuth } from '../middleware/auth.js';
import { CreateSubmissionRequestSchema, Message, VisibilityLevel } from '../types/submission.js';

export function createSubmissionRoutes(context: AppContext): Router {
  const router = Router();

  // List submissions (with visibility filtering based on user role)
  router.get('/', optionalAuth, async (req: AuthRequest, res) => {
    try {
      // Determine user's role for visibility filtering
      const userRoles = req.user?.roles || [];
      const isAdmin = userRoles.includes('admin');
      const isResearcher = userRoles.includes('researcher');
      
      // Parse query params for explicit filtering
      const visibilityParam = req.query.visibility as string | string[] | undefined;
      let requestedVisibility: VisibilityLevel[] | undefined;
      
      if (visibilityParam) {
        // Convert to array if single value
        requestedVisibility = (Array.isArray(visibilityParam) ? visibilityParam : [visibilityParam]) as VisibilityLevel[];
      }
      
      // Determine allowed visibility levels based on role
      let allowedVisibility: VisibilityLevel[];
      if (isAdmin) {
        // Admins see everything (unless explicitly filtered)
        allowedVisibility = requestedVisibility || ['pending', 'admin-only', 'researcher', 'public'];
      } else if (isResearcher) {
        // Researchers see public + researcher + admin-only (not pending)
        allowedVisibility = ['public', 'researcher', 'admin-only'];
        // If explicitly filtered, intersect with allowed
        if (requestedVisibility) {
          allowedVisibility = requestedVisibility.filter(v => allowedVisibility.includes(v));
        }
      } else {
        // Anonymous/viewers see only public
        allowedVisibility = ['public'];
      }
      
      // Fetch filtered submissions
      const submissions = await context.submissionStore.listSubmissions({
        visibility: allowedVisibility
      });
      
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
      console.log('[Submissions POST] Received request body:', JSON.stringify(req.body, null, 2));
      console.log('[Submissions POST] User ID:', req.userId);
      
      const data = CreateSubmissionRequestSchema.parse(req.body);
      console.log('[Submissions POST] Validation passed');
      
      // Determine initial visibility based on submitter's role
      const submitter = await context.userStore.getUserById(req.userId!);
      let visibility: VisibilityLevel = 'pending'; // Default for contributors
      
      if (submitter) {
        const isAdmin = submitter.roles.includes('admin');
        const isResearcher = submitter.roles.includes('researcher');
        const isAgent = submitter.roles.includes('agent');
        
        if (isAdmin || isResearcher) {
          // Trusted users bypass screening
          visibility = 'public';
        } else if (isAgent) {
          // Crawler bots go to admin-only (visible but needs approval for public)
          visibility = 'admin-only';
        }
        // Contributors and others stay at 'pending'
      }
      console.log('[Submissions POST] Assigned visibility:', visibility);
      
      const tempSubmissionId = uuidv4();
      
      // Convert request messages to full Message objects
      const messages: Message[] = data.messages.map(msg => ({
        ...msg,
        id: msg.id || uuidv4(),
        submission_id: tempSubmissionId,
        timestamp: msg.timestamp || new Date()
      }));

      // Prepare metadata with screening info
      const isAutoImported = data.source_type === 'discord' && (data.metadata as any)?.auto_imported === true;
      const metadata = {
        ...(data.metadata || {}),
        screening: {
          auto_imported: isAutoImported,
          import_source: isAutoImported ? 'discord-crawler' : 'manual'
        }
      };

      // Create submission with visibility
      const submission = await context.submissionStore.createSubmission(
        req.userId!,
        data.title,
        data.source_type,
        messages,
        metadata as any,
        data.arc_conversation_id ? {
          arc_conversation_id: data.arc_conversation_id
          // TODO: Fetch certification from ARC API
        } : undefined,
        visibility
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
      console.error('[Submissions POST] Error occurred:', error);
      console.error('[Submissions POST] Error name:', error.name);
      console.error('[Submissions POST] Error message:', error.message);
      
      if (error.name === 'ZodError') {
        console.error('[Submissions POST] Zod validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ 
          error: 'Invalid request', 
          details: error.errors,
          message: 'Validation failed - check details for specific field errors'
        });
      } else if (error.message.includes('tree')) {
        console.error('[Submissions POST] Tree validation error');
        res.status(400).json({ error: error.message });
      } else {
        console.error('[Submissions POST] Unexpected error:', error.stack);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Get submission
  router.get('/:submissionId', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      
      // Check visibility based on user role
      const userRoles = req.user?.roles || [];
      const isAdmin = userRoles.includes('admin');
      const isResearcher = userRoles.includes('researcher');
      const visibility = submission.visibility || 'public';
      
      // Determine if user can see this submission
      let canSee = false;
      if (visibility === 'public' || !submission.visibility) {
        canSee = true; // Public or legacy (no visibility) - everyone can see
      } else if (isAdmin) {
        canSee = true; // Admins see everything
      } else if (isResearcher && ['researcher', 'admin-only'].includes(visibility)) {
        canSee = true; // Researchers see researcher + admin-only
      }
      // Pending submissions: only admins can see via direct fetch
      
      if (!canSee) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      res.json(submission);
    } catch (error) {
      console.error('Get submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Pin a message (set pinned_message_id in metadata)
  router.post('/:submissionId/pin/:messageId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check permissions: owner, admin, or researcher can pin
      const user = await context.userStore.getUserById(req.userId!);
      const canPin = submission.submitter_id === req.userId! ||
                     user?.roles.includes('admin') ||
                     user?.roles.includes('researcher');
      
      if (!canPin) {
        res.status(403).json({ error: 'Only submission owner, researchers, and admins can pin messages' });
        return;
      }

      // Update metadata with pinned message ID
      const updatedSubmission = {
        ...submission,
        metadata: {
          ...submission.metadata,
          pinned_message_id: req.params.messageId
        }
      };

      await context.submissionStore.updateSubmission(
        req.params.submissionId,
        updatedSubmission
      );

      const result = await context.submissionStore.getSubmission(req.params.submissionId);
      res.json(result);
    } catch (error) {
      console.error('Pin message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Unpin message (remove pinned_message_id from metadata)
  router.delete('/:submissionId/pin', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check permissions: owner, admin, or researcher can unpin
      const user = await context.userStore.getUserById(req.userId!);
      const canPin = submission.submitter_id === req.userId! ||
                     user?.roles.includes('admin') ||
                     user?.roles.includes('researcher');
      
      if (!canPin) {
        res.status(403).json({ error: 'Only submission owner, researchers, and admins can unpin messages' });
        return;
      }

      // Remove pinned_message_id from metadata
      const updatedMetadata = {
        ...submission.metadata
      };
      delete (updatedMetadata as any).pinned_message_id;

      const updatedSubmission = {
        ...submission,
        metadata: updatedMetadata
      };

      await context.submissionStore.updateSubmission(
        req.params.submissionId,
        updatedSubmission
      );

      const result = await context.submissionStore.getSubmission(req.params.submissionId);
      res.json(result);
    } catch (error) {
      console.error('Unpin message error:', error);
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
      
      // Update title
      if (req.body.title !== undefined) {
        submission.title = req.body.title;
      }
      
      // Update metadata
      if (req.body.description !== undefined) {
        submission.metadata.description = req.body.description;
      }
      if (req.body.tags !== undefined) {
        submission.metadata.tags = req.body.tags;
      }
      
      // Update visibility (researcher/admin only)
      if (req.body.visibility !== undefined) {
        const canChangeVisibility = user?.roles.includes('researcher') || user?.roles.includes('admin');
        if (!canChangeVisibility) {
          res.status(403).json({ error: 'Only researchers and admins can change visibility' });
          return;
        }
        
        const validVisibilities = ['pending', 'admin-only', 'researcher', 'public'];
        if (!validVisibilities.includes(req.body.visibility)) {
          res.status(400).json({ error: 'Invalid visibility level', valid: validVisibilities });
          return;
        }
        
        submission.visibility = req.body.visibility;
        console.log(`[Submissions] Visibility changed to ${req.body.visibility} by ${req.userId}`);
      }

      await context.submissionStore.updateSubmission(req.params.submissionId, submission);

      // Don't attach on tag change - will be dynamically looked up from topics

      res.json(submission);
    } catch (error) {
      console.error('Update submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add reaction to message
  router.post('/:submissionId/messages/:messageId/reactions/:reactionType', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { messageId, reactionType } = req.params;
      
      if (!['star', 'laugh', 'sparkles'].includes(reactionType)) {
        res.status(400).json({ error: 'Invalid reaction type' });
        return;
      }
      
      context.annotationDb.addReaction(messageId, req.userId!, reactionType as 'star' | 'laugh' | 'sparkles');
      
      const reactions = context.annotationDb.getReactionsByMessage(messageId);
      res.json({ reactions });
    } catch (error) {
      console.error('Add reaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove reaction from message
  router.delete('/:submissionId/messages/:messageId/reactions/:reactionType', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { messageId, reactionType } = req.params;
      
      if (!['star', 'laugh', 'sparkles'].includes(reactionType)) {
        res.status(400).json({ error: 'Invalid reaction type' });
        return;
      }
      
      context.annotationDb.removeReaction(messageId, req.userId!, reactionType as 'star' | 'laugh' | 'sparkles');
      
      const reactions = context.annotationDb.getReactionsByMessage(messageId);
      res.json({ reactions });
    } catch (error) {
      console.error('Remove reaction error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get reactions for a message
  router.get('/:submissionId/messages/:messageId/reactions', async (req, res) => {
    try {
      const reactions = context.annotationDb.getReactionsByMessage(req.params.messageId);
      res.json({ reactions });
    } catch (error) {
      console.error('Get reactions error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get hidden messages for a submission (researchers/admins/owners only)
  router.get('/:submissionId/hidden-messages', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      const isResearcherOrAdmin = user?.roles.includes('researcher') || user?.roles.includes('admin');
      const isOwner = submission.submitter_id === req.userId;
      
      if (!isResearcherOrAdmin && !isOwner) {
        res.status(403).json({ error: 'Only researchers, admins, and submission owners can view hidden messages' });
        return;
      }
      
      const hiddenMessageIds = context.annotationDb.getHiddenMessagesBySubmission(req.params.submissionId);
      res.json({ hidden_message_ids: hiddenMessageIds });
    } catch (error) {
      console.error('Get hidden messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get submission messages (supports both authenticated and anonymous access)
  router.get('/:submissionId/messages', async (req, res) => {
    try {
      let messages = await context.submissionStore.getMessages(req.params.submissionId);
      
      // Get submission to check ownership
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (messages.length === 0) {
        // Check if submission exists
        if (!submission) {
          res.status(404).json({ error: 'Submission not found' });
          return;
        }
      }

      // Filter hidden messages for non-privileged users
      // Try to get user from token if present (optional auth)
      const authHeader = req.headers.authorization;
      let userRoles: string[] = [];
      let userId: string | undefined;
      
      console.log('[GET messages] Auth header present:', !!authHeader);
      console.log('[GET messages] Auth header value:', authHeader?.substring(0, 20) + '...');
      
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[GET messages] Full decoded token:', JSON.stringify(decoded, null, 2));
          userRoles = decoded.roles || [];
          userId = decoded.userId;
          console.log('[GET messages] Extracted - userId:', userId, 'roles:', userRoles);
        } catch (err: any) {
          console.log('[GET messages] Token decode failed:', err.message);
          // Invalid/expired token - treat as guest
        }
      } else {
        console.log('[GET messages] No Bearer token in auth header');
      }
      
      console.log('[GET messages] Final user roles:', userRoles);
      
      // Redact hidden messages for non-privileged users (not researchers/admins/owners)
      const isResearcherOrAdmin = userRoles.includes('researcher') || userRoles.includes('admin');
      const isOwner = submission && userId === submission.submitter_id;
      const canViewHidden = isResearcherOrAdmin || isOwner;
      
      const hiddenMessageIds = new Set(context.annotationDb.getHiddenMessagesBySubmission(req.params.submissionId));
      
      console.log('[GET messages] Hidden message IDs:', Array.from(hiddenMessageIds));
      console.log('[GET messages] Is researcher/admin:', isResearcherOrAdmin);
      console.log('[GET messages] Is owner:', isOwner);
      console.log('[GET messages] Can view hidden:', canViewHidden);
      
      if (!canViewHidden && hiddenMessageIds.size > 0) {
        // Replace content of hidden messages with block characters
        messages = messages.map(msg => {
          if (hiddenMessageIds.has(msg.id)) {
            // Count total characters in all text blocks
            const totalChars = msg.content_blocks
              .filter(b => b.type === 'text')
              .reduce((sum, b) => sum + (b.text?.length || 0), 0);
            
            // Generate block text with realistic word patterns
            let blockedText = '';
            let currentWordLength = 0;
            const maxWordLength = 12; // Cap word length
            
            for (let i = 0; i < totalChars; i++) {
              // Create spaces at word boundaries or randomly (30% chance)
              const shouldSpace = currentWordLength >= maxWordLength || 
                                  (currentWordLength > 2 && Math.random() < 0.30);
              
              if (shouldSpace) {
                blockedText += ' ';
                currentWordLength = 0;
              } else {
                blockedText += '▓'; // Medium shade block (darker than █)
                currentWordLength++;
              }
            }
            
            // Replace with redacted content
            return {
              ...msg,
              content_blocks: [{
                type: 'text' as const,
                text: blockedText
              }],
              _isHidden: true
            };
          }
          return msg;
        });
        console.log('[GET messages] Redacted', hiddenMessageIds.size, 'messages');
      }

      res.json({ messages });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Hide a message (admin or owner only)
  router.post('/:submissionId/messages/:messageId/hide', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('[POST hide] Hiding message:', req.params.messageId, 'in submission:', req.params.submissionId);
      
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check if user is admin or submission owner
      const user = await context.userStore.getUserById(req.userId!);
      const isAdmin = user?.roles.includes('admin');
      const isOwner = submission.submitter_id === req.userId;
      
      console.log('[POST hide] User:', req.userId, 'isAdmin:', isAdmin, 'isOwner:', isOwner);
      
      if (!isAdmin && !isOwner) {
        res.status(403).json({ error: 'Only admins and submission owners can hide messages' });
        return;
      }

      const { reason } = req.body;
      context.annotationDb.hideMessage(req.params.messageId, req.params.submissionId, req.userId!, reason);
      
      console.log('[POST hide] Message hidden successfully');
      
      res.json({ success: true });
    } catch (error) {
      console.error('Hide message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Unhide a message (admin or owner only)
  router.delete('/:submissionId/messages/:messageId/hide', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check if user is admin or submission owner
      const user = await context.userStore.getUserById(req.userId!);
      const isAdmin = user?.roles.includes('admin');
      const isOwner = submission.submitter_id === req.userId;
      
      if (!isAdmin && !isOwner) {
        res.status(403).json({ error: 'Only admins and submission owners can unhide messages' });
        return;
      }

      context.annotationDb.unhideMessage(req.params.messageId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Unhide message error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Hide all previous messages (current message + all with order < current.order)
  router.post('/:submissionId/messages/:messageId/hide-previous', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('[POST hide-previous] Hiding message and all previous:', req.params.messageId);
      
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      // Check if user is admin or submission owner
      const user = await context.userStore.getUserById(req.userId!);
      const isAdmin = user?.roles.includes('admin');
      const isOwner = submission.submitter_id === req.userId;
      
      console.log('[POST hide-previous] User:', req.userId, 'isAdmin:', isAdmin, 'isOwner:', isOwner);
      
      if (!isAdmin && !isOwner) {
        res.status(403).json({ error: 'Only admins and submission owners can hide messages' });
        return;
      }

      // Get all messages for this submission
      const messages = await context.submissionStore.getMessages(req.params.submissionId);
      
      // Find the target message
      const targetMessage = messages.find(m => m.id === req.params.messageId);
      if (!targetMessage) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }
      
      // Find all messages with order <= target message order
      const messagesToHide = messages.filter(m => m.order <= targetMessage.order);
      
      console.log('[POST hide-previous] Target message order:', targetMessage.order);
      console.log('[POST hide-previous] Hiding', messagesToHide.length, 'messages');
      
      // Hide all of them
      const { reason } = req.body;
      let hiddenCount = 0;
      for (const message of messagesToHide) {
        try {
          context.annotationDb.hideMessage(message.id, req.params.submissionId, req.userId!, reason);
          hiddenCount++;
        } catch (err) {
          console.error('[POST hide-previous] Failed to hide message:', message.id, err);
          // Continue hiding others even if one fails
        }
      }
      
      console.log('[POST hide-previous] Successfully hidden', hiddenCount, 'messages');
      
      res.json({ 
        success: true,
        hidden_count: hiddenCount,
        message_ids: messagesToHide.map(m => m.id)
      });
    } catch (error) {
      console.error('Hide previous messages error:', error);
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

