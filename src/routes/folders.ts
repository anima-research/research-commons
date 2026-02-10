import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import {
  CreateFolderRequestSchema,
  UpdateFolderRequestSchema,
  AddFolderMemberRequestSchema,
  AddFolderSubmissionRequestSchema,
  Folder
} from '../types/folder.js';

export function createFolderRoutes(context: AppContext): Router {
  const router = Router();

  // Helper: Check if user can access a folder
  async function canAccessFolder(userId: string, folder: Folder, userRoles: string[]): Promise<boolean> {
    // Owner always has access
    if (folder.created_by === userId) return true;

    // Admins see everything
    if (userRoles.includes('admin')) return true;

    switch (folder.visibility) {
      case 'private':
        // Truly private - owner only (already checked above)
        return false;

      case 'public':
        // Everyone can see
        return true;

      case 'shared':
        // Check role requirement
        if (folder.required_role && userRoles.includes(folder.required_role)) {
          return true;
        }
        // Check explicit whitelist
        if (context.annotationDb.isFolderMember(folder.id, userId)) {
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  // Helper: Check if user can modify a folder (owner or admin)
  function canModifyFolder(userId: string, folder: Folder, userRoles: string[]): boolean {
    return folder.created_by === userId || userRoles.includes('admin');
  }

  // Search users (lightweight, for member pickers - any authenticated user)
  router.get('/users/search', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const q = (req.query.q as string || '').toLowerCase();
      const allUsers = await context.userStore.getAllUsers();
      const results = allUsers
        .filter(u => u.id !== req.userId) // exclude self
        .filter(u => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        .map(u => ({ id: u.id, name: u.name, email: u.email }))
        .slice(0, 20);
      res.json({ users: results });
    } catch (err) {
      res.status(500).json({ error: 'Failed to search users' });
    }
  });

  // Get all folders accessible to the user
  router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await context.userStore.getUserById(req.userId!);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      const allFolders = await context.folderStore.getAllFolders();
      const accessibleFolders: Folder[] = [];

      for (const folder of allFolders) {
        if (await canAccessFolder(req.userId!, folder, user.roles)) {
          accessibleFolders.push(folder);
        }
      }

      // Sort by created_at descending
      accessibleFolders.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      res.json({ folders: accessibleFolders });
    } catch (error) {
      console.error('Get folders error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get folder by ID with submissions
  router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !(await canAccessFolder(req.userId!, folder, user.roles))) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get submissions in this folder
      const folderSubmissions = context.annotationDb.getFolderSubmissions(folder.id);
      const submissions = [];

      for (const fs of folderSubmissions) {
        const submission = await context.submissionStore.getSubmission(fs.submission_id);
        if (submission) {
          submissions.push({
            ...submission,
            added_to_folder_at: fs.added_at,
            added_to_folder_by: fs.added_by
          });
        }
      }

      // Get members if owner/admin
      let members: Array<{ user_id: string; added_by: string; added_at: string; name?: string }> = [];
      if (canModifyFolder(req.userId!, folder, user.roles)) {
        const rawMembers = context.annotationDb.getFolderMembers(folder.id);
        // Enrich with user names
        for (const m of rawMembers) {
          const memberUser = await context.userStore.getUserById(m.user_id);
          members.push({
            ...m,
            name: memberUser?.name
          });
        }
      }

      res.json({
        folder,
        submissions,
        members,
        submission_count: submissions.length,
        member_count: members.length
      });
    } catch (error) {
      console.error('Get folder error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Create folder (requires researcher+)
  router.post('/', authenticateToken, requireRole('researcher'), async (req: AuthRequest, res) => {
    try {
      const data = CreateFolderRequestSchema.parse(req.body);

      // Validate required_role only if shared
      if (data.visibility === 'shared' && data.required_role) {
        const validRoles = ['viewer', 'contributor', 'rater', 'expert', 'researcher', 'agent', 'admin'];
        if (!validRoles.includes(data.required_role)) {
          res.status(400).json({ error: `Invalid role: ${data.required_role}` });
          return;
        }
      }

      const folder = await context.folderStore.createFolder(
        data.name,
        req.userId!,
        data.visibility,
        {
          description: data.description,
          required_role: data.visibility === 'shared' ? data.required_role : undefined,
          color: data.color
        }
      );

      res.status(201).json({ folder });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Create folder error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update folder (owner or admin)
  router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const data = UpdateFolderRequestSchema.parse(req.body);

      // Validate required_role if provided
      if (data.required_role != null && data.required_role !== '') {
        const validRoles = ['viewer', 'contributor', 'rater', 'expert', 'researcher', 'agent', 'admin'];
        if (!validRoles.includes(data.required_role)) {
          res.status(400).json({ error: `Invalid role: ${data.required_role}` });
          return;
        }
      }

      const updates: Partial<Folder> = {};
      if (data.name !== undefined) updates.name = data.name;
      if (data.description !== undefined) updates.description = data.description || undefined;
      if (data.visibility !== undefined) updates.visibility = data.visibility;
      if (data.required_role !== undefined) {
        updates.required_role = data.required_role === null ? undefined : data.required_role;
      }
      if (data.color !== undefined) {
        updates.color = data.color === null ? undefined : data.color;
      }

      const updated = await context.folderStore.updateFolder(req.params.id, updates);
      res.json({ folder: updated });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Update folder error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Delete folder (owner or admin)
  router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      // Get info for response before deleting
      const submissionCount = context.annotationDb.getFolderSubmissions(folder.id).length;
      const memberCount = context.annotationDb.getFolderMembers(folder.id).length;

      // Delete folder from event store first - if this fails, nothing is lost
      await context.folderStore.deleteFolder(folder.id);

      // Clean up SQLite tables in a transaction
      context.annotationDb.deleteFolderData(folder.id);

      res.json({
        success: true,
        removed_submissions: submissionCount,
        removed_members: memberCount
      });
    } catch (error) {
      console.error('Delete folder error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add submission to folder
  router.post('/:id/submissions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const data = AddFolderSubmissionRequestSchema.parse(req.body);

      // Verify submission exists
      const submission = await context.submissionStore.getSubmission(data.submission_id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      context.annotationDb.addSubmissionToFolder(folder.id, data.submission_id, req.userId!);

      res.status(201).json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Add submission to folder error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Remove submission from folder
  router.delete('/:id/submissions/:submissionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      context.annotationDb.removeSubmissionFromFolder(folder.id, req.params.submissionId);

      res.json({ success: true });
    } catch (error) {
      console.error('Remove submission from folder error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add member to folder (share with user)
  router.post('/:id/members', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      const data = AddFolderMemberRequestSchema.parse(req.body);

      // Verify user exists
      const memberUser = await context.userStore.getUserById(data.user_id);
      if (!memberUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Auto-switch to 'shared' visibility if adding members to private folder
      let updatedFolder = folder;
      if (folder.visibility === 'private') {
        const result = await context.folderStore.updateFolder(folder.id, { visibility: 'shared' });
        if (!result) {
          res.status(404).json({ error: 'Folder not found' });
          return;
        }
        updatedFolder = result;
      }

      context.annotationDb.addFolderMember(folder.id, data.user_id, req.userId!);

      res.status(201).json({
        success: true,
        member: {
          user_id: data.user_id,
          name: memberUser.name
        },
        folder: updatedFolder
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Add folder member error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Remove member from folder
  router.delete('/:id/members/:userId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const folder = await context.folderStore.getFolder(req.params.id);
      if (!folder) {
        res.status(404).json({ error: 'Folder not found' });
        return;
      }

      const user = await context.userStore.getUserById(req.userId!);
      if (!user || !canModifyFolder(req.userId!, folder, user.roles)) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }

      context.annotationDb.removeFolderMember(folder.id, req.params.userId);

      res.json({ success: true });
    } catch (error) {
      console.error('Remove folder member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get folders containing a submission
  router.get('/by-submission/:submissionId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await context.userStore.getUserById(req.userId!);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Verify the caller can access this submission
      const submission = await context.submissionStore.getSubmission(req.params.submissionId);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      const vis = submission.visibility || 'public';
      const isResearcher = user.roles.includes('researcher') || user.roles.includes('admin');
      const canAccess = vis === 'public'
        || (vis === 'private' && (req.userId === submission.submitter_id || user.roles.includes('admin')))
        || (vis === 'researcher' && (isResearcher || req.userId === submission.submitter_id));
      if (!canAccess) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }

      const folderIds = context.annotationDb.getSubmissionFolderIds(req.params.submissionId);
      const folders: Folder[] = [];

      for (const folderId of folderIds) {
        const folder = await context.folderStore.getFolder(folderId);
        if (folder && await canAccessFolder(req.userId!, folder, user.roles)) {
          folders.push(folder);
        }
      }

      res.json({ folders });
    } catch (error) {
      console.error('Get folders by submission error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
