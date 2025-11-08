// Matches backend types
export * from './ontology'

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

export interface Message {
  id: string
  submission_id: string
  parent_message_id: string | null
  order: number
  participant_name: string
  participant_type: 'human' | 'model' | 'system'
  content_blocks: ContentBlock[]
  model_info?: ModelInfo
  timestamp?: string
}

export interface Submission {
  id: string
  title: string
  submitter_id: string
  source_type: 'arc-certified' | 'json-upload' | 'discord' | 'other'
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
  selection_id: string  // Always on selection
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
  created_by: string
  created_at: string
}

export interface Criterion {
  id: string
  topic_id?: string
  name: string
  description: string
  scale_type: 'numeric' | 'boolean' | 'likert'
  scale_min?: number
  scale_max?: number
  scale_labels?: string[]
  created_by: string
  created_at: string
}

