import { Router } from 'express';
import { AppContext } from '../index.js';
import { generateToken } from '../middleware/auth.js';
import { RegisterUserRequestSchema, LoginRequestSchema } from '../types/research.js';

export function createAuthRoutes(context: AppContext): Router {
  const router = Router();

  // Register new user
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name } = RegisterUserRequestSchema.parse(req.body);

      const user = await context.userStore.createUser(email, password, name);
      const token = generateToken(user);

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles
        },
        token
      });
    } catch (error: any) {
      if (error.message === 'User already exists') {
        res.status(409).json({ error: 'User already exists' });
      } else if (error.name === 'ZodError') {
        res.status(400).json({ error: 'Invalid request', details: error.errors });
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
        res.status(400).json({ error: 'Invalid request', details: error.errors });
      } else {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  return router;
}

