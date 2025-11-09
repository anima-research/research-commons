export interface Criterion {
  id: string
  ranking_system_id: string
  name: string
  description: string
  scale_type: 'numeric' | 'boolean' | 'likert'
  scale_min?: number
  scale_max?: number
  scale_labels?: string[]
}

export interface RankingSystem {
  id: string
  name: string
  description: string
  category: 'interviewer-quality' | 'model-behavior' | 'custom'
  created_by: string
  created_at: string
  permissions: 'public' | 'expert-only'
}

export interface SubmissionRankingSystem {
  id: string
  submission_id: string
  ranking_system_id: string
  attached_by: string
  attached_at: string
  usage_permissions: 'anyone' | 'expert-only' | 'researcher-only'
  is_from_topic: boolean
}

