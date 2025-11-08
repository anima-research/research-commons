export interface AnnotationTag {
  id: string
  ontology_id: string
  name: string
  description: string
  color: string
  examples?: string[]
}

export interface AnnotationOntology {
  id: string
  name: string
  description: string
  category: 'model-behavior' | 'interviewer-quality' | 'custom'
  created_by: string
  created_at: string
  permissions: 'public' | 'expert-only'
}

export interface SubmissionOntology {
  id: string
  submission_id: string
  ontology_id: string
  attached_by: string
  attached_at: string
  usage_permissions: 'anyone' | 'expert-only' | 'researcher-only'
  is_default: boolean
}

