<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Top Pane -->
    <div class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
      <!-- Navigation Bar -->
      <div class="px-4 py-3 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <button @click="router.push('/')" class="text-gray-600 hover:text-gray-900">
            ← Back to Browse
          </button>
          <div v-if="authStore.isAuthenticated()" class="text-sm text-gray-700">
            {{ authStore.user?.name }}
          </div>
        </div>
      </div>

      <!-- Submission Header -->
      <div class="px-4 py-4">
        <div class="flex items-start gap-3 mb-2">
          <h1 class="text-xl font-bold flex-1">
            {{ submission?.title || 'Loading...' }}
          </h1>
          <span 
            v-if="submission?.source_type === 'arc-certified'"
            class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium"
          >
            ✓ ARC Certified
          </span>
        </div>
        <div class="text-sm text-gray-600">
          <span>by {{ submission?.submitter_id }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatDate(submission?.submitted_at) }}</span>
          <span v-if="submission?.metadata.tags" class="ml-3">
            <span
              v-for="tag in submission.metadata.tags"
              :key="tag"
              class="mr-2"
            >
              #{{ tag }}
            </span>
          </span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="px-4 flex gap-6 text-sm">
        <button
          @click="activeTab = 'conversation'"
          class="pb-2 border-b-2 transition-colors"
          :class="activeTab === 'conversation' ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          💬 Conversation
        </button>
        <button
          @click="activeTab = 'comments'"
          class="pb-2 border-b-2 transition-colors"
          :class="activeTab === 'comments' ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          📝 Comments ({{ comments.length }})
        </button>
        <button
          @click="activeTab = 'ratings'"
          class="pb-2 border-b-2 transition-colors"
          :class="activeTab === 'ratings' ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          ⭐ Ratings ({{ ratings.length }})
        </button>
        <button
          @click="activeTab = 'overview'"
          class="pb-2 border-b-2 transition-colors"
          :class="activeTab === 'overview' ? 'border-indigo-600 text-indigo-600 font-medium' : 'border-transparent text-gray-600 hover:text-gray-900'"
        >
          📊 Overview
        </button>
      </div>
    </div>

    <!-- Main Content (below fixed header, add padding for selection toolbar) -->
    <div class="pt-48" :class="{ 'pt-60': showSelectionToolbar }">
      <!-- Conversation Tab -->
      <div v-if="activeTab === 'conversation'" class="flex">
        <!-- Conversation (left side, 60%) -->
        <div class="flex-1 max-w-[60%] px-4" ref="conversationContainerEl">
          <MessageList
            v-if="messages.length > 0"
            :messages="messages"
            @create-selection="handleCreateSelection"
            @create-comment="handleCreateComment"
            @create-rating="handleCreateRating"
            @selection-mode-changed="showSelectionToolbar = $event"
          />
          <div v-else class="p-8 text-center text-gray-500">
            <div v-if="loading">Loading conversation...</div>
            <div v-else>No messages found</div>
          </div>
        </div>

        <!-- Annotation Margin (right side, 40%, desktop only) -->
        <div v-if="!isMobile" class="hidden lg:block w-[40%] relative">
          <AnnotationMargin
            :annotations="marginAnnotations"
            :conversation-el="conversationContainerEl"
            @reply-comment="handleReplyComment"
          />
        </div>
      </div>

      <!-- Comments Tab -->
      <div v-else-if="activeTab === 'comments'" class="max-w-4xl mx-auto p-6">
        <h2 class="text-xl font-semibold mb-4">All Comments ({{ comments.length }})</h2>
        
        <!-- Debug -->
        <div class="text-xs text-gray-400 mb-2">
          Debug: {{ comments.length }} comments loaded
        </div>
        
        <div v-if="comments.length === 0" class="text-center py-12 text-gray-500">
          No comments yet. Be the first to comment!
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold">
                {{ getUserInitial(comment.author_id) }}
              </div>
              <div class="flex-1">
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="font-semibold">{{ getUserName(comment.author_id) }}</span>
                  <span class="text-xs text-gray-500">{{ formatDate(comment.created_at) }}</span>
                </div>
                <div class="text-gray-800">{{ comment.content }}</div>
                <div class="text-xs text-gray-500 mt-2">
                  on {{ comment.target_type }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ratings Tab -->
      <div v-else-if="activeTab === 'ratings'" class="max-w-4xl mx-auto p-6">
        <h2 class="text-xl font-semibold mb-4">All Ratings</h2>
        <div class="text-center py-12 text-gray-500">
          No ratings yet.
        </div>
      </div>

      <!-- Overview Tab -->
      <div v-else-if="activeTab === 'overview'" class="max-w-4xl mx-auto p-6">
        <h2 class="text-xl font-semibold mb-4">Submission Overview</h2>
        <div class="bg-white rounded-lg p-6 space-y-4">
          <div>
            <div class="text-sm text-gray-600">Participants</div>
            <div class="text-lg">{{ submission?.metadata.participants_summary?.join(', ') || 'Loading...' }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Source</div>
            <div class="text-lg">{{ submission?.source_type }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-600">Messages</div>
            <div class="text-lg">{{ messages.length }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Comment Form Modal -->
    <CommentForm
      :show="showCommentForm"
      :selected-text="commentContext?.text"
      @submit="submitComment"
      @cancel="showCommentForm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubmissionsStore } from '@/stores/submissions'
import MessageList from '@/components/MessageList.vue'
import AnnotationMargin from '@/components/AnnotationMargin.vue'
import CommentForm from '@/components/CommentForm.vue'
import type { Message, Selection, Comment, Rating } from '@/types'
import type { MarginAnnotation } from '@/utils/layout-manager'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const submissionsStore = useSubmissionsStore()

const submissionId = route.params.id as string
const loading = ref(true)
const activeTab = ref('conversation')
const isMobile = ref(window.innerWidth < 1024)

const submission = ref()
const messages = ref<Message[]>([])
const selections = ref<Selection[]>([])
const comments = ref<Comment[]>([])
const ratings = ref<Rating[]>([])

const showSelectionForm = ref(false)
const pendingSelectionData = ref<any>(null)

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await loadData()
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

async function loadData() {
  loading.value = true
  try {
    submission.value = await submissionsStore.fetchSubmission(submissionId)
    messages.value = await submissionsStore.fetchMessages(submissionId)
    selections.value = await submissionsStore.fetchSelections(submissionId)
    const fetchedComments = await submissionsStore.fetchComments(submissionId)
    console.log('Fetched comments:', fetchedComments)
    comments.value = fetchedComments
    console.log('Comments ref value:', comments.value)
  } catch (err) {
    console.error('Failed to load submission:', err)
  } finally {
    loading.value = false
  }
}

function handleCreateSelection(data: any) {
  pendingSelectionData.value = data
  showSelectionForm.value = true
}

const showCommentForm = ref(false)
const commentContext = ref<{ messageId: string; text?: string } | null>(null)
const conversationContainerEl = ref<HTMLElement | null>(null)
const showSelectionToolbar = ref(false)

// Build margin annotations from comments, ratings, selections
const marginAnnotations = computed<MarginAnnotation[]>(() => {
  const annotations: MarginAnnotation[] = []
  
  // Add comments as annotations (only selection-level comments in margin)
  comments.value.forEach(comment => {
    if (comment.target_type === 'selection') {
      // Find the selection to get message anchor
      const sel = selections.value.find(s => s.id === comment.target_id)
      if (sel) {
        annotations.push({
          id: comment.id,
          type: 'comment',
          anchorMessageId: sel.start_message_id,
          priority: 5,
          minHeight: 80,
          data: comment
        })
      }
    }
    // Skip submission-level and comment-level comments from margin
    // (they appear in Comments tab instead)
  })
  
  // Add ratings as annotations
  ratings.value.forEach(rating => {
    let anchorMessageId = rating.target_id
    if (rating.target_type === 'selection') {
      const sel = selections.value.find(s => s.id === rating.target_id)
      anchorMessageId = sel?.start_message_id || anchorMessageId
    } else {
      anchorMessageId = messages.value[0]?.id || ''
    }
    
    annotations.push({
      id: rating.id,
      type: 'rating',
      anchorMessageId,
      priority: 3, // Lower than comments
      minHeight: 60,
      data: rating
    })
  })
  
  return annotations
})

function handleCreateComment(messageId: string, text?: string) {
  commentContext.value = { messageId, text }
  showCommentForm.value = true
}

function handleCreateRating(messageId: string) {
  console.log('Rate message:', messageId)
  // TODO: Show rating form
}

async function saveSelection(data: any) {
  try {
    await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: data.start_message_id,
      start_offset: data.start_offset,
      end_message_id: data.end_message_id,
      end_offset: data.end_offset,
      label: data.label
    })
    
    // Refresh selections
    selections.value = await submissionsStore.fetchSelections(submissionId)
    showSelectionForm.value = false
    pendingSelectionData.value = null
  } catch (err) {
    console.error('Failed to create selection:', err)
  }
}

function cancelSelection() {
  showSelectionForm.value = false
  pendingSelectionData.value = null
}

async function submitComment(text: string) {
  if (!commentContext.value) return
  
  try {
    console.log('Submitting comment:', text)
    
    // Create a selection for the whole message first
    const selection = await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: commentContext.value.messageId,
      end_message_id: commentContext.value.messageId,
      // null offsets = whole message
      start_offset: undefined,
      end_offset: undefined,
      label: undefined
    })
    
    console.log('Auto-created selection:', selection)
    
    // Now create comment on that selection
    const result = await submissionsStore.createComment({
      submission_id: submissionId,
      target_id: selection.id, // Comment on the selection
      target_type: 'selection',
      content: text
    })
    
    console.log('Comment created:', result)
    
    // Refresh data
    selections.value = await submissionsStore.fetchSelections(submissionId)
    comments.value = await submissionsStore.fetchComments(submissionId)
    console.log('Refreshed - selections:', selections.value.length, 'comments:', comments.value.length)
    
    showCommentForm.value = false
    commentContext.value = null
  } catch (err) {
    console.error('Failed to create comment:', err)
  }
}

function getUserInitial(userId: string) {
  // TODO: Look up actual user
  return 'U'
}

function getUserName(userId: string) {
  // TODO: Look up actual user
  if (userId === authStore.user?.id) {
    return authStore.user.name
  }
  return 'User ' + userId.substring(0, 8)
}

function focusSelection(id: string) {
  console.log('Focus selection:', id)
  // TODO: Scroll to and highlight selection
}

function focusComment(id: string) {
  console.log('Focus comment:', id)
  // Switch to comments tab and highlight
  activeTab.value = 'comments'
}

function handleReplyComment(commentId: string) {
  console.log('Reply to comment:', commentId)
  // TODO: Open reply form
}

function formatDate(date?: string) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}
</script>

