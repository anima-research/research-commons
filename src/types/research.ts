import { z } from 'zod';

// Research topic
export const TopicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  default_ontologies: z.array(z.string().uuid()).default([]),  // Auto-attach to submissions
  created_by: z.string().uuid(),
  created_at: z.date()
});

export type Topic = z.infer<typeof TopicSchema>;

// Evaluation criterion
export const CriterionSchema = z.object({
  id: z.string().uuid(),
  topic_id: z.string().uuid().optional(), // Can be general or topic-specific
  name: z.string(),
  description: z.string(),
  scale_type: z.enum(['numeric', 'boolean', 'likert']),
  scale_min: z.number().optional(),
  scale_max: z.number().optional(),
  scale_labels: z.array(z.string()).optional(), // For likert scales
  created_by: z.string().uuid(),
  created_at: z.date()
});

export type Criterion = z.infer<typeof CriterionSchema>;

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
  default_ontologies: z.array(z.string().uuid()).optional()
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
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string()
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

