import { Router } from 'express';
import { z } from 'zod';
import { AppContext } from '../index.js';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth.js';
import { RegisterUserRequestSchema, LoginRequestSchema, UpdateProfileRequestSchema, UpdatePasswordRequestSchema } from '../types/research.js';

const ForgotPasswordRequestSchema = z.object({
  email: z.string().email('Invalid email address')
});

const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
});

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
      if (error.message === 'Email already in use') {
        res.status(409).json({ error: 'Email already in use' });
      } else if (error.message === 'Username already taken') {
        res.status(409).json({ error: 'Username already taken' });
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

  // Get user profile data (submissions and comments)
  router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      
      // Get user submissions
      const allSubmissions = await context.submissionStore.listSubmissions();
      const userSubmissions = allSubmissions.filter(sub => sub.submitter_id === userId);
      
      // Enhance submissions with stats
      const submissionsWithStats = await Promise.all(userSubmissions.map(async sub => {
        try {
          const selections = context.annotationDb.getSelectionsBySubmission(sub.id);
          const tagCount = new Set(
            selections.flatMap(s => s.annotation_tags || [])
          ).size;
          
          const allComments = selections.flatMap(s => 
            context.annotationDb.getCommentsBySelection(s.id)
          );
          const commentCount = allComments.length;
          
          return {
            ...sub,
            stats: {
              tag_count: tagCount,
              comment_count: commentCount
            }
          };
        } catch (err) {
          console.error('Error enhancing submission:', sub.id, err);
          return {
            ...sub,
            stats: {
              tag_count: 0,
              comment_count: 0
            }
          };
        }
      }));
      
      // Get user selections and comments
      const userSelections = context.annotationDb.getSelectionsByUser(userId);
      
      // For each selection, get its submission info and comments
      const commentsWithContext = await Promise.all(
        userSelections.map(async selection => {
          const submission = await context.submissionStore.getSubmission(selection.submission_id);
          const comments = context.annotationDb.getCommentsBySelection(selection.id);
          
          // Filter to only comments by this user
          const userComments = comments.filter(c => c.author_id === userId);
          
          return userComments.map(comment => ({
            ...comment,
            submission_id: selection.submission_id,
            submission_title: submission?.title || 'Unknown',
            selection_text: selection.label || 'Selection'
          }));
        })
      );
      
      // Flatten and sort by date
      const allUserComments = commentsWithContext
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      res.json({
        submissions: submissionsWithStats,
        comments: allUserComments
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update user profile
  router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const updates = UpdateProfileRequestSchema.parse(req.body);

      // At least one field must be provided
      if (!updates.name && !updates.email) {
        res.status(400).json({ error: 'At least one field (name or email) must be provided' });
        return;
      }

      const updatedUser = await context.userStore.updateUserProfile(userId, updates);
      
      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Generate new token with updated info
      const token = generateToken(updatedUser);

      res.json({
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          roles: updatedUser.roles
        },
        token,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      if (error.name === 'ZodError') {
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else if (error.message === 'Email already in use by another account') {
        res.status(409).json({ error: error.message });
      } else if (error.message === 'Username already taken by another account') {
        res.status(409).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Update user password
  router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.userId!;
      const data = UpdatePasswordRequestSchema.parse(req.body);

      const user = await context.userStore.getUserById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValid = await context.userStore.validatePassword(user.email, data.currentPassword);
      if (!isValid) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Update password
      await context.userStore.updateUserPassword(userId, data.newPassword);

      res.json({ message: 'Password updated successfully' });
    } catch (error: any) {
      console.error('Update password error:', error);
      
      if (error.name === 'ZodError') {
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Request password reset (sends email)
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = ForgotPasswordRequestSchema.parse(req.body);

      // Check if email service is configured
      if (!context.emailService) {
        res.status(503).json({ 
          error: 'Email service not configured. Contact an administrator for password reset.' 
        });
        return;
      }

      // Generate reset token (returns null if email doesn't exist)
      const result = await context.userStore.createPasswordResetToken(email);
      
      // Always return success to prevent email enumeration
      // But only send email if user exists
      if (result) {
        const sent = await context.emailService.sendPasswordResetEmail(
          email, 
          result.token, 
          result.user.name
        );
        
        if (!sent) {
          console.error('[Auth] Failed to send password reset email to:', email);
        }
      } else {
        console.log('[Auth] Password reset requested for non-existent email:', email);
      }

      // Always return same response to prevent email enumeration
      res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      
      if (error.name === 'ZodError') {
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Reset password with token
  router.post('/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = ResetPasswordRequestSchema.parse(req.body);

      // Validate and consume token
      const tokenInfo = await context.userStore.consumePasswordResetToken(token);
      
      if (!tokenInfo) {
        res.status(400).json({ error: 'Invalid or expired reset token' });
        return;
      }

      // Update password
      await context.userStore.updateUserPassword(tokenInfo.userId, newPassword);

      res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      if (error.name === 'ZodError') {
        const firstError = error.errors?.[0]?.message || 'Invalid request';
        res.status(400).json({ error: firstError, details: error.errors });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });

  // Validate reset token (for frontend to check before showing form)
  router.get('/validate-reset-token/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const tokenInfo = await context.userStore.validatePasswordResetToken(token);
      
      if (!tokenInfo) {
        res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
        return;
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Validate reset token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}

