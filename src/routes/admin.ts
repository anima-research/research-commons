import { Router } from 'express';
import { AppContext } from '../index.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

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

  // List all users (admin-only)
  router.get('/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const users = await context.userStore.getAllUsers();
      res.json({ users });
    } catch (error) {
      console.error('List users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

