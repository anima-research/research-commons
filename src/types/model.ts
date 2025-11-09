import { z } from 'zod';

/**
 * Model Registry - defines available AI models
 */

export const ModelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  
  // Technical details
  provider: z.enum(['anthropic', 'openai', 'google', 'meta', 'other']),
  model_id: z.string(), // e.g. "claude-3-5-sonnet-20241022"
  
  // UI customization
  avatar: z.string(), // emoji or URL
  color: z.string(), // hex color for UI
  
  created_by: z.string().uuid(),
  created_at: z.date()
});

export type Model = z.infer<typeof ModelSchema>;

// API request schemas
export const CreateModelRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  provider: z.enum(['anthropic', 'openai', 'google', 'meta', 'other']),
  model_id: z.string(),
  avatar: z.string().default('🤖'),
  color: z.string().default('#6366f1')
});

export type CreateModelRequest = z.infer<typeof CreateModelRequestSchema>;

