import { Router } from 'express';
import { AppContext } from '../index.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { RegisterUserRequestSchema, LoginRequestSchema } from '../types/research.js';

export function createAuthRoutes(context: AppContext): Router {
  const router = Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name } = RegisterUserRequestSchema.parse(req.body);

      // Check if this is the first user
      const allUsers = await context.userStore.getAllUsers();
      const isFirstUser = allUsers.length === 0;

      const user = await context.userStore.createUser(email, password, name);
      
      // Make first user admin and researcher automatically
      if (isFirstUser) {
        await context.userStore.addUserRole(user.id, 'admin');
        await context.userStore.addUserRole(user.id, 'researcher');
        // Refresh user object to include new roles
        const updatedUser = await context.userStore.getUserById(user.id);
        if (updatedUser) {
          console.log(`✅ First user registered as admin: ${updatedUser.email}`);
        }
      }
      
      // Get the latest user object with all roles
      const finalUser = await context.userStore.getUserById(user.id) || user;
      const token = generateToken(finalUser);

      res.status(201).json({
        user: {
          id: finalUser.id,
          email: finalUser.email,
          name: finalUser.name,
          roles: finalUser.roles
        },
        token
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        res.status(409).json({ error: 'User already exists' });
      } else if (error.name === 'ZodError') {
        // Extract the first error message for user-friendly display
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = LoginRequestSchema.parse(req.body);

      const user = await context.userStore.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const valid = await context.userStore.validatePassword(email, password);
      if (!valid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        token
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        // Extract the first error message for user-friendly display
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Refresh session - get fresh user data and new token
  router.post('/refresh', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await context.userStore.getUserById(req.userId!);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Generate new token with current roles
      const token = generateToken(user);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        token
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get user names by IDs (for displaying attributions)
  router.post('/users/names', async (req, res) => {
    try {
      const { user_ids } = req.body;
      if (!Array.isArray(user_ids)) {
        res.status(400).json({ error: 'user_ids must be an array' });
        return;
      }

      const userNames: Record<string, string> = {};
      for (const userId of user_ids) {
        const user = await context.userStore.getUserById(userId);
        if (user) {
          userNames[userId] = user.name;
        }
      }

      res.json({ user_names: userNames });
    } catch (error) {
      console.error('Get user names error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

