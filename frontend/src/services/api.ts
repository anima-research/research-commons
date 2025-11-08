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
    api.post<{ user: User; token: string }>('/auth/login', { email, password })
}

export const submissionsAPI = {
  list: () =>
    api.get<{ submissions: Submission[] }>('/submissions'),
  
  create: (data: any) =>
    api.post<Submission>('/submissions', data),
  
  get: (id: string) =>
    api.get<Submission>(`/submissions/${id}`),
  
  getMessages: (id: string) =>
    api.get<{ messages: Message[] }>(`/submissions/${id}/messages`),
  
  getRatings: (id: string) =>
    api.get<{ ratings: Rating[] }>(`/submissions/${id}/ratings`)
}

export const annotationsAPI = {
  createSelection: (data: Omit<Selection, 'id' | 'created_by' | 'created_at'>) =>
    api.post<Selection>('/annotations/selections', data),
  
  getSelections: (submissionId: string) =>
    api.get<{ selections: Selection[] }>(`/annotations/selections/submission/${submissionId}`),
  
  createComment: (data: Omit<Comment, 'id' | 'author_id' | 'created_at'>) =>
    api.post<Comment>('/annotations/comments', data),
  
  getComments: (submissionId: string) =>
    api.get<{ comments: Comment[] }>(`/annotations/comments/submission/${submissionId}`),
  
  createRating: (data: Omit<Rating, 'id' | 'rater_id' | 'created_at'>) =>
    api.post<Rating>('/annotations/ratings', data),
  
  getRatings: (submissionId: string) =>
    api.get<{ ratings: Rating[] }>(`/annotations/ratings/submission/${submissionId}`)
}

export const researchAPI = {
  getTopics: () =>
    api.get<{ topics: Topic[] }>('/research/topics'),
  
  createTopic: (name: string, description: string) =>
    api.post<Topic>('/research/topics', { name, description }),
  
  getCriteria: () =>
    api.get<{ criteria: Criterion[] }>('/research/criteria'),
  
  createCriterion: (data: any) =>
    api.post<Criterion>('/research/criteria', data)
}

export default api

