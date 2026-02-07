import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { User } from '../types/research.js';

/**
 * Admin-only endpoints for user management
 */
export function createAdminRoutes(context: AppContext): Router {
  const router = Router();

  // Promote user to admin (admin-only)
  router.post('/promote/:userId', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.params.userId;
      const user = await context.userStore.getUserById(targetUserId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Add admin and researcher roles
      await context.userStore.addUserRole(targetUserId, 'admin');
      await context.userStore.addUserRole(targetUserId, 'researcher');

      res.json({ 
        success: true, 
        message: `User ${user.name} promoted to admin`,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: [...user.roles, 'admin', 'researcher']
        }
      });
    } catch (error) {
      console.error('Promote user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Make first user admin (one-time, no auth required)
  router.post('/bootstrap-admin', async (req, res) => {
    try {
      // Check if any admin exists
      const allUsers = await context.userStore.getAllUsers();
      const hasAdmin = allUsers.some(u => u.roles.includes('admin'));
      
      if (hasAdmin) {
        res.status(403).json({ error: 'Admin already exists. Use /promote endpoint with admin credentials.' });
        return;
      }

      // Get first user (by creation date)
      if (allUsers.length === 0) {
        res.status(404).json({ error: 'No users found. Register first.' });
        return;
      }

      const firstUser = allUsers[0];
      
      // Make them admin
      await context.userStore.addUserRole(firstUser.id, 'admin');
      await context.userStore.addUserRole(firstUser.id, 'researcher');

      res.json({ 
        success: true,
        message: `First user ${firstUser.name} is now admin`,
        user: {
          id: firstUser.id,
          name: firstUser.name,
          email: firstUser.email
        }
      });
    } catch (error) {
      console.error('Bootstrap admin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // List all users with stats (admin-only)
  router.get('/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const users = await context.userStore.getAllUsers();
      
      // Get stats for each user
      const usersWithStats = await Promise.all(users.map(async (user) => {
        const stats = await getUserStats(context, user.id);
        return {
          ...user,
          stats
        };
      }));
      
      res.json({ users: usersWithStats });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get single user with stats (admin-only)
  router.get('/users/:userId', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const user = await context.userStore.getUserById(req.params.userId);
      
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const stats = await getUserStats(context, user.id);
      
      res.json({ 
        user: {
          ...user,
          stats
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user roles (admin-only)
  router.put('/users/:userId/roles', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const targetUserId = req.params.userId;
      let { roles } = req.body;
      
      if (!Array.isArray(roles)) {
        res.status(400).json({ error: 'Roles must be an array' });
        return;
      }
      
      // Validate roles
      const validRoles: User['roles'][number][] = ['viewer', 'contributor', 'rater', 'expert', 'researcher', 'agent', 'admin'];
      const invalidRoles = roles.filter(r => !validRoles.includes(r));
      if (invalidRoles.length > 0) {
        res.status(400).json({ error: `Invalid roles: ${invalidRoles.join(', ')}` });
        return;
      }
      
      // Ensure at least one role remains
      if (roles.length === 0) {
        roles = ['viewer'];
      }
      
      const user = await context.userStore.getUserById(targetUserId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Prevent removing admin role from yourself
      if (req.user?.id === targetUserId && user.roles.includes('admin') && !roles.includes('admin')) {
        res.status(400).json({ error: 'Cannot remove admin role from yourself' });
        return;
      }
      
      const updatedUser = await context.userStore.updateUserRoles(targetUserId, roles as User['roles']);
      
      res.json({ 
        success: true, 
        message: `Roles updated for ${user.name}`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user roles error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Add role to user (admin-only)
  router.post('/users/:userId/roles/:role', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { userId, role } = req.params;
      
      const validRoles: User['roles'][number][] = ['viewer', 'contributor', 'rater', 'expert', 'researcher', 'agent', 'admin'];
      if (!validRoles.includes(role as User['roles'][number])) {
        res.status(400).json({ error: `Invalid role: ${role}` });
        return;
      }
      
      const user = await context.userStore.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      const updatedUser = await context.userStore.addUserRole(userId, role as User['roles'][number]);
      
      res.json({ 
        success: true, 
        message: `Added ${role} role to ${user.name}`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Add user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Remove role from user (admin-only)
  router.delete('/users/:userId/roles/:role', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const { userId, role } = req.params;
      
      const user = await context.userStore.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }
      
      // Prevent removing admin role from yourself
      if (req.user?.id === userId && role === 'admin') {
        res.status(400).json({ error: 'Cannot remove admin role from yourself' });
        return;
      }
      
      // Remove the role
      const newRoles = user.roles.filter(r => r !== role) as User['roles'];
      
      // Ensure at least one role remains
      if (newRoles.length === 0) {
        newRoles.push('viewer');
      }
      
      const updatedUser = await context.userStore.updateUserRoles(userId, newRoles);
      
      res.json({ 
        success: true, 
        message: `Removed ${role} role from ${user.name}`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Remove user role error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get system-wide stats (admin-only)
  router.get('/stats', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const users = await context.userStore.getAllUsers();
      const submissions = await context.submissionStore.listSubmissions();
      
      // Count users by role
      const roleBreakdown: Record<string, number> = {};
      for (const user of users) {
        for (const role of user.roles) {
          roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
        }
      }
      
      // Count submissions by visibility
      const visibilityBreakdown: Record<string, number> = {};
      for (const sub of submissions) {
        const vis = sub.visibility || 'public';
        visibilityBreakdown[vis] = (visibilityBreakdown[vis] || 0) + 1;
      }
      
      res.json({
        stats: {
          total_users: users.length,
          total_submissions: submissions.length,
          users_by_role: roleBreakdown,
          submissions_by_visibility: visibilityBreakdown
        }
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

// Helper function to get user stats
async function getUserStats(context: AppContext, userId: string): Promise<{
  submission_count: number;
  comment_count: number;
  rating_count: number;
  tag_count: number;
  selection_count: number;
}> {
  // Get submission count from submission store
  const allSubmissions = await context.submissionStore.listSubmissions();
  const userSubmissions = allSubmissions.filter(s => s.submitter_id === userId);
  
  // Get annotation stats from database
  // For now, we'll get selections by user and count from there
  const selections = context.annotationDb.getSelectionsByUser(userId);
  
  // Count comments and ratings - these require iterating through all submissions
  // This is a bit expensive but acceptable for admin panel
  let commentCount = 0;
  let ratingCount = 0;
  let tagCount = 0;
  
  // Get all selections to count tags by this user
  for (const submission of allSubmissions) {
    const submissionSelections = context.annotationDb.getSelectionsBySubmission(submission.id);
    
    for (const selection of submissionSelections) {
      // Count comments by this user
      const comments = context.annotationDb.getCommentsBySelection(selection.id);
      commentCount += comments.filter(c => c.author_id === userId).length;
      
      // Count tags by this user
      const attributions = context.annotationDb.getTagAttributions(selection.id);
      tagCount += attributions.filter(a => a.tagged_by === userId).length;
    }
    
    // Count ratings by this user
    const ratings = context.annotationDb.getRatingsBySubmission(submission.id);
    ratingCount += ratings.filter(r => r.rater_id === userId).length;
  }
  
  return {
    submission_count: userSubmissions.length,
    comment_count: commentCount,
    rating_count: ratingCount,
    tag_count: tagCount,
    selection_count: selections.length
  };
}