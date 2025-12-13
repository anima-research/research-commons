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

// Handle auth errors (expired/invalid tokens)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get 401 or 403, the token is likely expired or invalid
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only logout if we had a token (avoid logout loop on login failures)
      const hadToken = localStorage.getItem('auth_token')
      if (hadToken) {
        console.log('[API] Auth error detected, logging out...')
        // Clear auth data
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        // Dispatch event so Vue components can react (e.g., redirect to login)
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } }))
      }
    }
    return Promise.reject(error)
  }
)

export const importsAPI = {
  fetchDiscordMessages: (params: { lastMessageUrl: string; firstMessageUrl?: string; maxMessages?: number }) =>
    api.post<{ messages: any[]; title: string; metadata: any; existing_mappings_by_user_id: any }>('/imports/discord/fetch', {
      source_type: 'discord',
      discord_params: params
    }),

  saveMappings: (sourceType: string, mappings: Array<{ 
    source_user_id: string; 
    source_username: string; 
    source_display_name?: string;
    avatar_url?: string;
    model_id?: string; 
    is_human: boolean 
  }>) =>
    api.post<{ success: boolean; count: number }>('/imports/save-mappings', {
      source_type: sourceType,
      mappings
    }),

  importDiscord: (params: { lastMessageUrl: string; firstMessageUrl?: string; maxMessages?: number }, topicTags?: string[]) =>
    api.post<{ submission_id: string; message_count: number; title: string }>('/imports/discord', {
      source_type: 'discord',
      discord_params: params,
      topic_tags: topicTags || []
    }),
  
  checkDiscordStatus: () =>
    api.get<{ available: boolean; configured: boolean }>('/imports/discord/status')
}

export const discordPreviewAPI = {
  fetchMessages: (lastMessageUrl: string, firstMessageUrl?: string, limit?: number) =>
    api.post<{ messages: Array<{
      id: string;
      discord_message_id: string;
      author_name: string;
      author_username: string;
      content: string;
      timestamp: string;
      is_bot: boolean;
      message_url: string;
    }>; has_more: boolean }>('/discord-preview/messages', {
      lastMessageUrl,
      firstMessageUrl,
      limit: limit || 50
    })
}

export const authAPI = {
  register: (email: string, password: string, name: string) =>
    api.post<{ user: User; token: string }>('/auth/register', { email, password, name }),
  
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),
  
  refresh: () =>
    api.post<{ user: User; token: string }>('/auth/refresh'),
  
  getUserNames: (userIds: string[]) =>
    api.post<{ user_names: Record<string, string> }>('/auth/users/names', { user_ids: userIds }),
  
  getProfile: () =>
    api.get<{ 
      submissions: Array<Submission & { stats: { tag_count: number; comment_count: number } }>;
      comments: Array<Comment & { submission_id: string; submission_title: string; selection_text: string }> 
    }>('/auth/profile'),
  
  updateProfile: (updates: { name?: string; email?: string }) =>
    api.patch<{ user: User; token: string; message: string }>('/auth/profile', updates),
  
  updatePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put<{ message: string }>('/auth/password', data),
  
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),
  
  validateResetToken: (token: string) =>
    api.get<{ valid: boolean }>(`/auth/validate-reset-token/${token}`),
  
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword })
}

export const submissionsAPI = {
  list: () =>
    api.get<{ submissions: Submission[] }>('/submissions'),
  
  create: (data: any) =>
    api.post<Submission>('/submissions', data),
  
  get: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),
  
  update: (id: string, updates: { title?: string; description?: string; tags?: string[] }) =>
    api.patch<Submission>(`/submissions/${id}`, updates),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/submissions/${id}`),
  
  getMessages: (id: string) =>
    api.get<{ messages: Message[] }>(`/submissions/${id}/messages`),
  
  getRatings: (id: string) =>
    api.get<{ ratings: Rating[] }>(`/submissions/${id}/ratings`),
  
  pinMessage: (submissionId: string, messageId: string) =>
    api.post<Submission>(`/submissions/${submissionId}/pin/${messageId}`),
  
  unpinMessage: (submissionId: string) =>
    api.delete<Submission>(`/submissions/${submissionId}/pin`),
  
  addReaction: (submissionId: string, messageId: string, reactionType: 'star' | 'laugh' | 'sparkles') =>
    api.post<{ reactions: Array<{ user_id: string; reaction_type: string }> }>(`/submissions/${submissionId}/messages/${messageId}/reactions/${reactionType}`),
  
  removeReaction: (submissionId: string, messageId: string, reactionType: 'star' | 'laugh' | 'sparkles') =>
    api.delete<{ reactions: Array<{ user_id: string; reaction_type: string }> }>(`/submissions/${submissionId}/messages/${messageId}/reactions/${reactionType}`),
  
  getReactions: (submissionId: string, messageId: string) =>
    api.get<{ reactions: Array<{ user_id: string; reaction_type: string; created_at: string }> }>(`/submissions/${submissionId}/messages/${messageId}/reactions`),
  
  hideMessage: (submissionId: string, messageId: string, reason?: string) =>
    api.post<{ success: boolean }>(`/submissions/${submissionId}/messages/${messageId}/hide`, { reason }),
  
  unhideMessage: (submissionId: string, messageId: string) =>
    api.delete<{ success: boolean }>(`/submissions/${submissionId}/messages/${messageId}/hide`),
  
  hideAllPrevious: (submissionId: string, messageId: string, reason?: string) =>
    api.post<{ success: boolean; hidden_count: number; message_ids: string[] }>(`/submissions/${submissionId}/messages/${messageId}/hide-previous`, { reason }),

  setHiddenFromModels: (submissionId: string, messageId: string, hidden: boolean) =>
    api.post<{ success: boolean; hidden_from_models: boolean }>(`/submissions/${submissionId}/messages/${messageId}/hidden-from-models`, { hidden }),
  
  getHiddenMessages: (submissionId: string) =>
    api.get<{ hidden_message_ids: string[] }>(`/submissions/${submissionId}/hidden-messages`)
}

export const annotationsAPI = {
  createSelection: (data: Omit<Selection, 'id' | 'created_by' | 'created_at' | 'annotation_tags'>) =>
    api.post<Selection>('/annotations/selections', data),
  
  getSelections: (submissionId: string) =>
    api.get<{ selections: Selection[] }>(`/annotations/selections/submission/${submissionId}`),
  
  deleteSelection: (selectionId: string) =>
    api.delete<{ success: boolean }>(`/annotations/selections/${selectionId}`),
  
  removeTag: (selectionId: string, tagId: string) =>
    api.delete<{ success: boolean }>(`/annotations/selections/${selectionId}/tags/${tagId}`),
  
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
  
  update: (id: string, data: any) =>
    api.put<any>(`/ontologies/${id}`, data),
  
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
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/rankings/${id}`),
  
  attach: (submissionId: string, rankingSystemId: string, usagePermissions: string) =>
    api.post<any>('/rankings/attach', { submission_id: submissionId, ranking_system_id: rankingSystemId, usage_permissions: usagePermissions }),
  
  // Use new combined endpoint that includes topic-derived systems
  getForSubmission: (submissionId: string) =>
    api.get<{ ranking_systems: any[] }>(`/submission-systems/${submissionId}/ranking-systems`),
  
  detach: (submissionId: string, systemId: string) =>
    api.delete<{ success: boolean }>(`/rankings/submission/${submissionId}/system/${systemId}`)
}

export const modelsAPI = {
  list: () =>
    api.get<{ models: any[] }>('/models'),
  
  get: (id: string) =>
    api.get<{ model: any }>(`/models/${id}`),
  
  create: (data: any) =>
    api.post<any>('/models', data),
  
  update: (id: string, data: any) =>
    api.put<any>(`/models/${id}`, data),
  
  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/models/${id}`)
}

export default api

