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
  content: z.string(),
  signature: z.string().optional()
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextContentBlockSchema,
  ImageContentBlockSchema,
  ThinkingContentBlockSchema
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

// Message in the conversation tree
export const MessageSchema = z.object({
  id: z.string().uuid(),
  submission_id: z.string().uuid(),
  parent_message_id: z.string().uuid().nullable(),
  order: z.number().int(),
  participant_name: z.string(),
  participant_type: z.enum(['human', 'model', 'system']),
  content_blocks: z.array(ContentBlockSchema),
  model_info: ModelInfoSchema.optional(),
  timestamp: z.date().optional()
});

export type Message = z.infer<typeof MessageSchema>;

// Certification data for ARC-imported submissions
export const CertificationDataSchema = z.object({
  arc_conversation_id: z.string().optional(),
  signature_hash: z.string().optional(),
  verified_at: z.date().optional()
});

export type CertificationData = z.infer<typeof CertificationDataSchema>;

// Submission metadata
export const SubmissionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  submitter_id: z.string().uuid(),
  source_type: z.enum(['arc-certified', 'json-upload', 'discord', 'other']),
  certification_data: CertificationDataSchema.optional(),
  metadata: z.object({
    original_date: z.date().optional(),
    participants_summary: z.array(z.string()).optional(),
    model_summary: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  }).passthrough(), // Allow additional fields
  submitted_at: z.date()
});

export type Submission = z.infer<typeof SubmissionSchema>;

// Simplified message for API requests (IDs and submission_id filled by server)
export const CreateMessageRequestSchema = z.object({
  id: z.string().uuid().optional(),
  parent_message_id: z.string().uuid().nullable(),
  order: z.number().int(),
  participant_name: z.string(),
  participant_type: z.enum(['human', 'model', 'system']),
  content_blocks: z.array(ContentBlockSchema),
  model_info: ModelInfoSchema.optional(),
  timestamp: z.date().optional()
});

// For API requests
export const CreateSubmissionRequestSchema = z.object({
  title: z.string(),
  source_type: z.enum(['arc-certified', 'json-upload', 'discord', 'other']),
  arc_conversation_id: z.string().optional(),
  messages: z.array(CreateMessageRequestSchema),
  metadata: z.record(z.unknown()).optional()
});

export type CreateSubmissionRequest = z.infer<typeof CreateSubmissionRequestSchema>;

