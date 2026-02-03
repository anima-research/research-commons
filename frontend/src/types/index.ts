// Matches backend types
export * from './ontology'
export * from './ranking'

export interface User {
  id: string
  email: string
  name: string
  roles: ('viewer' | 'contributor' | 'rater' | 'expert' | 'researcher' | 'agent' | 'admin')[]
}

export interface ContentBlock {
  type: 'text' | 'image' | 'thinking'
  text?: string
  image?: { mime_type: string; data: string }
  thinking?: { content: string; signature?: string }
}

export interface ModelInfo {
  model_id: string
  provider: string
  reasoning_enabled: boolean
  max_tokens?: number
  provider_metadata?: Record<string, unknown>
}

// Message branch (for loom submissions)
export interface MessageBranch {
  id: string
  participant_name: string
  participant_type: 'human' | 'model' | 'system'
  content_blocks: ContentBlock[]
  parent_branch_id?: string
  model_info?: ModelInfo
  hidden_from_models?: boolean
  timestamp?: string
  metadata?: Record<string, any>
}

export interface Message {
  id: string
  submission_id: string
  parent_message_id?: string | null // For non-loom
  order: number
  // Old format fields (for non-loom)
  participant_name?: string
  participant_type?: 'human' | 'model' | 'system'
  content_blocks?: ContentBlock[]
  model_info?: ModelInfo
  timestamp?: string
  metadata?: Record<string, any> // Discord message ID, avatar URL, etc.
  hidden_from_models?: boolean // Message excluded from AI model context
  // Branch format fields (for loom)
  branches?: MessageBranch[]
  active_branch_id?: string
}

export type Visibility = 'public' | 'unlisted' | 'researcher' | 'private'

// Submission types - conversation is default, document is single-message, loom is branched
export type SubmissionType = 'conversation' | 'document' | 'loom'

export interface Submission {
  id: string
  title: string
  submitter_id: string
  submission_type?: SubmissionType // defaults to 'conversation'
  source_type: 'arc-certified' | 'json-upload' | 'discord' | 'other'
  visibility?: Visibility
  certification_data?: {
    arc_conversation_id?: string
    signature_hash?: string
    verified_at?: string
  }
  metadata: {
    original_date?: string
    participants_summary?: string[]
    model_summary?: string[]
    tags?: string[]
    description?: string
  }
  submitted_at: string
}

export interface Selection {
  id: string
  submission_id: string
  created_by: string
  start_message_id: string
  start_offset?: number
  end_message_id: string
  end_offset?: number
  label?: string
  annotation_tags: string[]  // Tag IDs
  tag_attributions?: Array<{
    tag_id: string
    tagged_by: string
    tagged_at: Date
  }>
  created_at: string
}

export interface Comment {
  id: string
  selection_id: string  // Always on selection
  author_id: string
  parent_id?: string
  content: string
  created_at: string
  updated_at?: string
}

export interface Rating {
  id: string
  submission_id: string  // Always on submission
  rater_id: string
  criterion_id: string
  score: number
  created_at: string
  updated_at?: string
}

export interface Topic {
  id: string
  name: string
  description: string
  default_ontologies: string[]
  default_ranking_systems: string[]
  created_by: string
  created_at: string
}

