import { z } from 'zod';

// Content blocks for multimodal messages
export const TextContentBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string()
});

export const ImageContentBlockSchema = z.object({
  type: z.literal('image'),
  mime_type: z.string(),
  data: z.string() // base64
});

export const ThinkingContentBlockSchema = z.object({
  type: z.literal('thinking'),
  thinking: z.object({
    content: z.string(),
    signature: z.string().optional()
  })
});

export const FileAttachmentBlockSchema = z.object({
  type: z.literal('tm_blob_file'),
  text: z.string(),
  id: z.string().optional(),
  sync: z.object({
    at: z.string(),
    url: z.string(),
    blobID: z.number()
  }).optional(),
  metadata: z.object({
    name: z.string(),
    size: z.number(),
    type: z.string(),
    characters: z.number().optional(),
    fileFormat: z.string().optional(),
    estimatedTokens: z.number().optional()
  }).optional()
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextContentBlockSchema,
  ImageContentBlockSchema,
  ThinkingContentBlockSchema,
  FileAttachmentBlockSchema
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// Model information for inference messages
export const ModelInfoSchema = z.object({
  model_id: z.string(),
  provider: z.string(),
  reasoning_enabled: z.boolean(),
  max_tokens: z.number().optional(),
  provider_metadata: z.record(z.unknown()).optional(),
  raw_request: z.record(z.unknown()).optional(),
  raw_response: z.record(z.unknown()).optional()
});

export type ModelInfo = z.infer<typeof ModelInfoSchema>;

// Message branch schema (for loom submissions)
export const MessageBranchSchema = z.object({
  id: z.string().uuid(),
  participant_name: z.string(),
  participant_type: z.enum(['human', 'model', 'system']),
  content_blocks: z.array(ContentBlockSchema),
  parent_branch_id: z.string().uuid().optional(),
  model_info: ModelInfoSchema.optional(),
  hidden_from_models: z.boolean().optional(),
  timestamp: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type MessageBranch = z.infer<typeof MessageBranchSchema>;

// Message in the conversation tree
// For 'loom' submissions: uses branches array and active_branch_id
// For other submissions: uses parent_message_id, participant_name, etc.
export const MessageSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  parent_message_id: z.string().uuid().nullable().optional(), // For non-loom
  order: z.number().int(),
  // Old format fields (for non-loom)
  participant_name: z.string().optional(),
  participant_type: z.enum(['human', 'model', 'system']).optional(),
  content_blocks: z.array(ContentBlockSchema).optional(),
  model_info: ModelInfoSchema.optional(),
  timestamp: z.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  hidden_from_models: z.boolean().optional(),
  // Branch format fields (for loom)
  branches: z.array(MessageBranchSchema).optional(),
  active_branch_id: z.string().uuid().optional(),
}).refine((data: any) => {
  // For loom: must have branches and active_branch_id
  // For non-loom: must have participant_name, content_blocks, etc.
  const hasBranches = data.branches && data.branches.length > 0;
  const hasOldFormat = data.participant_name && data.content_blocks;
  
  // Must have either branches (loom) or old format (non-loom), not both
  return hasBranches !== hasOldFormat;
}, {
  message: "Message must have either branches (loom) or old format fields (non-loom), not both"
});

export type Message = z.infer<typeof MessageSchema>;

// Certification data for ARC-imported submissions
export const CertificationDataSchema = z.object({
  arc_conversation_id: z.string().optional(),
  signature_hash: z.string().optional(),
  verified_at: z.date().optional()
});

export type CertificationData = z.infer<typeof CertificationDataSchema>;

// Visibility levels for submissions
export const VisibilitySchema = z.enum(['public', 'unlisted', 'researcher', 'private']);
export type Visibility = z.infer<typeof VisibilitySchema>;

// Submission types - conversation is default, document is single-message, loom is branched
export const SubmissionTypeSchema = z.enum(['conversation', 'document', 'loom']);
export type SubmissionType = z.infer<typeof SubmissionTypeSchema>;

// Submission metadata
export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  submitter_id: z.string().uuid(),
  submission_type: SubmissionTypeSchema.default('conversation'),
  source_type: z.enum(['arc-certified', 'json-upload', 'discord', 'other']),
  visibility: VisibilitySchema.default('researcher'),
  certification_data: CertificationDataSchema.optional(),
  metadata: z.object({
    original_date: z.date().optional(),
    participants_summary: z.array(z.string()).optional(),
    model_summary: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    pinned_message_id: z.string().uuid().optional()
  }).passthrough(), // Allow additional fields
  submitted_at: z.date(),
  deleted: z.boolean().optional(),
  deleted_at: z.date().optional(),
  deleted_by: z.string().uuid().optional()
});

export type Submission = z.infer<typeof SubmissionSchema>;

// Simplified message for API requests (IDs and submission_id filled by server)
export const CreateMessageRequestSchema = z.object({
  id: z.string().uuid().optional(),
  // Old format (for non-loom)
  parent_message_id: z.string().uuid().nullable().optional(),
  order: z.number().int(),
  participant_name: z.string().optional(),
  participant_type: z.enum(['human', 'model', 'system']).optional(),
  content_blocks: z.array(ContentBlockSchema).optional(),
  model_info: ModelInfoSchema.optional(),
  timestamp: z.coerce.date().optional(),
  metadata: z.record(z.unknown()).optional(),
  // Branch format (for loom)
  branches: z.array(z.object({
    id: z.string().uuid().optional(),
    participant_name: z.string(),
    participant_type: z.enum(['human', 'model', 'system']),
    content_blocks: z.array(ContentBlockSchema),
    parent_branch_id: z.string().uuid().optional(),
    model_info: ModelInfoSchema.optional(),
    hidden_from_models: z.boolean().optional(),
    timestamp: z.coerce.date().optional(),
    metadata: z.record(z.unknown()).optional(),
  })).optional(),
  active_branch_id: z.string().uuid().optional(),
});

// For API requests
export const CreateSubmissionRequestSchema = z.object({
  title: z.string(),
  submission_type: SubmissionTypeSchema.optional(), // defaults to 'conversation'
  source_type: z.enum(['arc-certified', 'json-upload', 'discord', 'other']),
  visibility: VisibilitySchema.optional(), // defaults to 'researcher' in store
  arc_conversation_id: z.string().optional(),
  messages: z.array(CreateMessageRequestSchema),
  metadata: z.record(z.unknown()).optional()
});

export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

