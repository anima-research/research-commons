import { z } from 'zod';

// Selection: a range in the submission (Google Docs style)
export const SelectionSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  created_by: z.string().uuid(),
  
  start_message_id: z.string().uuid(),
  start_offset: z.number().int().optional(),
  end_message_id: z.string().uuid(),
  end_offset: z.number().int().optional(),
  
  label: z.string().optional(),  // Freeform label (legacy/optional)
  annotation_tags: z.array(z.string().uuid()).default([]),  // Tag IDs from ontologies
  
  created_at: z.date()
});

export type Selection = z.infer<typeof SelectionSchema>;

// Comment: always targets a selection (can be threaded)
export const CommentSchema = z.object({
  id: z.string().uuid(),
  selection_id: z.string().uuid(),  // Always on selection
  author_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),  // Threading
  
  content: z.string(),
  created_at: z.date(),
  updated_at: z.date().optional()
});

export type Comment = z.infer<typeof CommentSchema>;

// Rating: linked to criterion, always on submission (not selection)
export const RatingSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),  // Always on submission
  rater_id: z.string().uuid(),
  
  criterion_id: z.string().uuid(),
  score: z.number(),
  
  created_at: z.date(),
  updated_at: z.date().optional()
});

export type Rating = z.infer<typeof RatingSchema>;

// API request schemas
export const CreateSelectionRequestSchema = z.object({
  submission_id: z.string().uuid(),
  start_message_id: z.string().uuid(),
  start_offset: z.number().int().optional(),
  end_message_id: z.string().uuid(),
  end_offset: z.number().int().optional(),
  label: z.string().optional()
});

export const CreateCommentRequestSchema = z.object({
  selection_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),
  content: z.string()
});

export const CreateRatingRequestSchema = z.object({
  submission_id: z.string().uuid(),
  criterion_id: z.string().uuid(),
  score: z.number()
});

