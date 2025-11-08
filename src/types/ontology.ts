import { z } from 'zod';

// Annotation tag within an ontology
export const AnnotationTagSchema = z.object({
  id: z.string().uuid(),
  ontology_id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  color: z.string(),
  examples: z.array(z.string()).optional()
});

export type AnnotationTag = z.infer<typeof AnnotationTagSchema>;

// Annotation ontology
export const AnnotationOntologySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  category: z.enum(['model-behavior', 'interviewer-quality', 'custom']),
  created_by: z.string().uuid(),
  created_at: z.date(),
  permissions: z.enum(['public', 'expert-only'])
});

export type AnnotationOntology = z.infer<typeof AnnotationOntologySchema>;

// Ontology attached to submission
export const SubmissionOntologySchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  ontology_id: z.string().uuid(),
  attached_by: z.string().uuid(),
  attached_at: z.date(),
  usage_permissions: z.enum(['anyone', 'expert-only', 'researcher-only']),
  is_default: z.boolean()
});

export type SubmissionOntology = z.infer<typeof SubmissionOntologySchema>;

// API request schemas
export const CreateOntologyRequestSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(['model-behavior', 'interviewer-quality', 'custom']),
  permissions: z.enum(['public', 'expert-only']),
  tags: z.array(z.object({
    name: z.string(),
    description: z.string(),
    color: z.string(),
    examples: z.array(z.string()).optional()
  }))
});

export const AttachOntologyRequestSchema = z.object({
  submission_id: z.string().uuid(),
  ontology_id: z.string().uuid(),
  usage_permissions: z.enum(['anyone', 'expert-only', 'researcher-only'])
});

export const ApplyTagsRequestSchema = z.object({
  selection_id: z.string().uuid(),
  tag_ids: z.array(z.string().uuid())
});

