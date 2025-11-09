import { z } from 'zod';

// Criterion within a ranking system
export const CriterionSchema = z.object({
  id: z.string().uuid(),
  ranking_system_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  scale_type: z.enum(['numeric', 'boolean', 'likert']),
  scale_min: z.number().optional(),
  scale_max: z.number().optional(),
  scale_labels: z.array(z.string()).optional()
});

export type Criterion = z.infer<typeof CriterionSchema>;

// Ranking system
export const RankingSystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['interviewer-quality', 'model-behavior', 'custom']),
  created_by: z.string().uuid(),
  created_at: z.date(),
  permissions: z.enum(['public', 'expert-only'])
});

export type RankingSystem = z.infer<typeof RankingSystemSchema>;

// Ranking system attached to submission
export const SubmissionRankingSystemSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  ranking_system_id: z.string().uuid(),
  attached_by: z.string().uuid(),
  attached_at: z.date(),
  usage_permissions: z.enum(['anyone', 'expert-only', 'researcher-only']),
  is_from_topic: z.boolean()  // If true, cannot be detached
});

export type SubmissionRankingSystem = z.infer<typeof SubmissionRankingSystemSchema>;

// API request schemas
export const CreateRankingSystemRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['interviewer-quality', 'model-behavior', 'custom']),
  permissions: z.enum(['public', 'expert-only']),
  criteria: z.array(z.object({
    name: z.string(),
    description: z.string(),
    scale_type: z.enum(['numeric', 'boolean', 'likert']),
    scale_min: z.number().optional(),
    scale_max: z.number().optional(),
    scale_labels: z.array(z.string()).optional()
  }))
});

export const AttachRankingSystemRequestSchema = z.object({
  submission_id: z.string().uuid(),
  ranking_system_id: z.string().uuid(),
  usage_permissions: z.enum(['anyone', 'expert-only', 'researcher-only'])
});

