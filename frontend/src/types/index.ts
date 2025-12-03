// Matches backend types
export * from './ontology'
export * from './ranking'

// Visibility levels for submission screening
export type VisibilityLevel = 'pending' | 'admin-only' | 'researcher' | 'public'

// Screening metadata
export interface ScreeningMetadata {
  auto_imported?: boolean
  import_source?: string
  reviewed_at?: string
  reviewed_by?: string
  rejection_reason?: string
}

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
  metadata?: Record<string, any> // Discord message ID, avatar URL, etc.
}

export interface Submission {
  id: string
  title: string
  submitter_id: string
  source_type: 'arc-certified' | 'json-upload' | 'discord' | 'other'
  visibility?: VisibilityLevel  // Screening visibility state (default: 'public')
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
    screening?: ScreeningMetadata  // Screening workflow metadata
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

