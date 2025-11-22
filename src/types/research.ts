import { z } from 'zod';

// Research topic
export const TopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  default_ontologies: z.array(z.string().uuid()).default([]),  // Auto-attach to submissions
  default_ranking_systems: z.array(z.string().uuid()).default([]),  // Auto-attach to submissions
  created_by: z.string().uuid(),
  created_at: z.date()
});

export type Topic = z.infer<typeof TopicSchema>;

// Criterion - moved to ranking.ts
// Note: Import from ranking.ts directly if needed

// User (for research commons, separate from ARC)
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  roles: z.array(z.enum(['viewer', 'contributor', 'rater', 'expert', 'researcher', 'agent', 'admin'])),
  created_at: z.date(),
  updated_at: z.date().optional()
});

export type User = z.infer<typeof UserSchema>;

// API request schemas
export const CreateTopicRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  default_ontologies: z.array(z.string().uuid()).optional(),
  default_ranking_systems: z.array(z.string().uuid()).optional()
});

export const CreateCriterionRequestSchema = z.object({
  topic_id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string(),
  scale_type: z.enum(['numeric', 'boolean', 'likert']),
  scale_min: z.number().optional(),
  scale_max: z.number().optional(),
  scale_labels: z.array(z.string()).optional()
});

export const RegisterUserRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required")
});

export const LoginRequestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required")
});

