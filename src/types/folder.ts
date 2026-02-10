import { z } from 'zod';

// Folder visibility types
export const FolderVisibilitySchema = z.enum(['private', 'shared', 'public']);
export type FolderVisibility = z.infer<typeof FolderVisibilitySchema>;

// Folder entity (stored in event store)
export const FolderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  created_by: z.string().uuid(),
  created_at: z.date(),

  // Visibility
  visibility: FolderVisibilitySchema,
  required_role: z.string().optional(),  // Only used when visibility = 'shared'

  // Metadata
  color: z.string().optional()
});

export type Folder = z.infer<typeof FolderSchema>;

// Folder member (stored in SQLite)
export interface FolderMember {
  folder_id: string;
  user_id: string;
  added_by: string;
  added_at: Date;
}

// Folder submission relationship (stored in SQLite)
export interface FolderSubmission {
  folder_id: string;
  submission_id: string;
  added_by: string;
  added_at: Date;
}

// API request schemas
export const CreateFolderRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
  visibility: FolderVisibilitySchema.default('private'),
  required_role: z.string().optional(),
  color: z.string().optional()
});

export const UpdateFolderRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  visibility: FolderVisibilitySchema.optional(),
  required_role: z.string().nullable().optional(),  // null to clear
  color: z.string().nullable().optional()
});

export const AddFolderMemberRequestSchema = z.object({
  user_id: z.string().uuid()
});

export const AddFolderSubmissionRequestSchema = z.object({
  submission_id: z.string().uuid()
});
