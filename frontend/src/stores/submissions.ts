import { defineStore } from 'pinia'
import { ref } from 'vue'
import { submissionsAPI, annotationsAPI } from '@/services/api'
import type { Submission, Message, Selection, Comment, Rating } from '@/types'

export const useSubmissionsStore = defineStore('submissions', () => {
  const submissions = ref<Map<string, Submission>>(new Map())
  const messages = ref<Map<string, Message[]>>(new Map())
  const selections = ref<Map<string, Selection[]>>(new Map())
  const comments = ref<Map<string, Comment[]>>(new Map())
  const ratings = ref<Map<string, Rating[]>>(new Map())
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubmission(id: string) {
    loading.value = true
    error.value = null
    try {
      const response = await submissionsAPI.get(id)
      submissions.value.set(id, response.data)
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch submission'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(submissionId: string) {
    try {
      const response = await submissionsAPI.getMessages(submissionId)
      messages.value.set(submissionId, response.data.messages)
      return response.data.messages
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch messages'
      throw err
    }
  }

  async function fetchSelections(submissionId: string) {
    try {
      const response = await annotationsAPI.getSelections(submissionId)
      selections.value.set(submissionId, response.data.selections)
      return response.data.selections
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch selections'
      throw err
    }
  }

  async function fetchComments(submissionId: string) {
    try {
      const response = await annotationsAPI.getComments(submissionId)
      comments.value.set(submissionId, response.data.comments)
      return response.data.comments
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch comments'
      throw err
    }
  }

  async function createSelection(data: Omit<Selection, 'id' | 'created_by' | 'created_at'>) {
    try {
      const response = await annotationsAPI.createSelection(data)
      
      // Add to cache
      const existing = selections.value.get(data.submission_id) || []
      selections.value.set(data.submission_id, [...existing, response.data])
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create selection'
      throw err
    }
  }

  async function createComment(data: Omit<Comment, 'id' | 'author_id' | 'created_at'>) {
    try {
      const response = await annotationsAPI.createComment(data)
      
      // Add to cache
      const existing = comments.value.get(data.submission_id) || []
      comments.value.set(data.submission_id, [...existing, response.data])
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create comment'
      throw err
    }
  }

  async function createRating(data: Omit<Rating, 'id' | 'rater_id' | 'created_at'>) {
    try {
      const response = await annotationsAPI.createRating(data)
      
      // Add to cache
      const existing = ratings.value.get(data.submission_id) || []
      ratings.value.set(data.submission_id, [...existing, response.data])
      
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to create rating'
      throw err
    }
  }

  function getSubmission(id: string) {
    return submissions.value.get(id)
  }

  function getMessages(submissionId: string) {
    return messages.value.get(submissionId) || []
  }

  function getSelections(submissionId: string) {
    return selections.value.get(submissionId) || []
  }

  function getComments(submissionId: string) {
    return comments.value.get(submissionId) || []
  }

  function getRatings(submissionId: string) {
    return ratings.value.get(submissionId) || []
  }

  return {
    loading,
    error,
    fetchSubmission,
    fetchMessages,
    fetchSelections,
    fetchComments,
    createSelection,
    createComment,
    createRating,
    getSubmission,
    getMessages,
    getSelections,
    getComments,
    getRatings
  }
})

