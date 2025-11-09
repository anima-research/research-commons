import axios from 'axios'
import type { User, Submission, Message, Selection, Comment, Rating, Topic, Criterion } from '@/types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  
  refresh: () =>
    api.post<{ user: User; token: string }>('/auth/refresh')
}

export const submissionsAPI = {
  list: () =>
    api.get<{ submissions: Submission[] }>('/submissions'),
  
  create: (data: any) =>
    api.post<Submission>('/submissions', data),
  
  get: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),
  
  update: (id: string, updates: { description?: string; tags?: string[] }) =>
    api.patch<Submission>(`/submissions/${id}`, updates),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/submissions/${id}`),
  
  getMessages: (id: string) =>
    api.get<{ messages: Message[] }>(`/submissions/${id}/messages`),
  
  getRatings: (id: string) =>
    api.get<{ ratings: Rating[] }>(`/submissions/${id}/ratings`)
}

export const annotationsAPI = {
  createSelection: (data: Omit<Selection, 'id' | 'created_by' | 'created_at' | 'annotation_tags'>) =>
    api.post<Selection>('/annotations/selections', data),
  
  getSelections: (submissionId: string) =>
    api.get<{ selections: Selection[] }>(`/annotations/selections/submission/${submissionId}`),
  
  deleteSelection: (selectionId: string) =>
    api.delete<{ success: boolean }>(`/annotations/selections/${selectionId}`),
  
  createComment: (data: Omit<Comment, 'id' | 'author_id' | 'created_at'>) =>
    api.post<Comment>('/annotations/comments', data),
  
  getCommentsBySelection: (selectionId: string) =>
    api.get<{ comments: Comment[] }>(`/annotations/comments/selection/${selectionId}`),
  
  deleteComment: (commentId: string) =>
    api.delete<{ success: boolean }>(`/annotations/comments/${commentId}`),
  
  createRating: (data: Omit<Rating, 'id' | 'rater_id' | 'created_at'>) =>
    api.post<Rating>('/annotations/ratings', data),
  
  getRatingsBySubmission: (submissionId: string) =>
    api.get<{ ratings: Rating[] }>(`/annotations/ratings/submission/${submissionId}`),
  
  deleteRating: (ratingId: string) =>
    api.delete<{ success: boolean }>(`/annotations/ratings/${ratingId}`)
}

export const ontologiesAPI = {
  list: () =>
    api.get<{ ontologies: any[] }>('/ontologies'),
  
  get: (id: string) =>
    api.get<{ ontology: any; tags: any[] }>(`/ontologies/${id}`),
  
  create: (data: any) =>
    api.post<any>('/ontologies', data),
  
  attach: (submissionId: string, ontologyId: string, usagePermissions: string) =>
    api.post<any>('/ontologies/attach', { submission_id: submissionId, ontology_id: ontologyId, usage_permissions: usagePermissions }),
  
  // Use new combined endpoint that includes topic-derived systems
  getForSubmission: (submissionId: string) =>
    api.get<{ ontologies: any[] }>(`/submission-systems/${submissionId}/ontologies`),
  
  applyTags: (selectionId: string, tagIds: string[]) =>
    api.post<{ success: boolean }>('/ontologies/tags/apply', { selection_id: selectionId, tag_ids: tagIds })
}

export const researchAPI = {
  getTopics: () =>
    api.get<{ topics: Topic[] }>('/research/topics'),
  
  getTopic: (id: string) =>
    api.get<Topic>(`/research/topics/${id}`),
  
  createTopic: (data: { name: string; description: string; default_ontologies?: string[]; default_ranking_systems?: string[] }) =>
    api.post<Topic>('/research/topics', data),
  
  updateTopic: (id: string, updates: Partial<Topic>) =>
    api.patch<Topic>(`/research/topics/${id}`, updates),
  
  deleteTopic: (id: string) =>
    api.delete<{ success: boolean }>(`/research/topics/${id}`)
}

export const rankingsAPI = {
  list: () =>
    api.get<{ ranking_systems: any[] }>('/rankings'),
  
  get: (id: string) =>
    api.get<{ ranking_system: any; criteria: any[] }>(`/rankings/${id}`),
  
  create: (data: any) =>
    api.post<any>('/rankings', data),
  
  update: (id: string, data: any) =>
    api.put<any>(`/rankings/${id}`, data),
  
  attach: (submissionId: string, rankingSystemId: string, usagePermissions: string) =>
    api.post<any>('/rankings/attach', { submission_id: submissionId, ranking_system_id: rankingSystemId, usage_permissions: usagePermissions }),
  
  // Use new combined endpoint that includes topic-derived systems
  getForSubmission: (submissionId: string) =>
    api.get<{ ranking_systems: any[] }>(`/submission-systems/${submissionId}/ranking-systems`),
  
  detach: (submissionId: string, systemId: string) =>
    api.delete<{ success: boolean }>(`/rankings/submission/${submissionId}/system/${systemId}`)
}

export default api

