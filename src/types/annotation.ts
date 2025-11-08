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
  
  label: z.string().optional(),
  created_at: z.date()
});

export type Selection = z.infer<typeof SelectionSchema>;

// Comment: can target submission, selection, or other comment (threading)
export const CommentSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  author_id: z.string().uuid(),
  
  target_id: z.string().uuid(),
  target_type: z.enum(['submission', 'selection', 'comment']),
  parent_id: z.string().uuid().optional(),
  
  content: z.string(),
  created_at: z.date(),
  updated_at: z.date().optional()
});

export type Comment = z.infer<typeof CommentSchema>;

// Rating: linked to criterion, optionally to comment
export const RatingSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  rater_id: z.string().uuid(),
  
  target_id: z.string().uuid(),
  target_type: z.enum(['submission', 'selection']),
  
  criterion_id: z.string().uuid(),
  score: z.number(),
  
  comment_id: z.string().uuid().optional(),
  
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
  submission_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.enum(['submission', 'selection', 'comment']),
  parent_id: z.string().uuid().optional(),
  content: z.string()
});

export const CreateRatingRequestSchema = z.object({
  submission_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.enum(['submission', 'selection']),
  criterion_id: z.string().uuid(),
  score: z.number(),
  comment_id: z.string().uuid().optional()
});

