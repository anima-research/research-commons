<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Fixed Top Pane -->
    <div class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30" ref="headerEl">
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

      <!-- Submission Header (Unscrollable) -->
      <div class="px-4 py-4 space-y-3">
        <!-- Title and badges -->
        <div class="flex items-start gap-3">
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
        
        <!-- Meta info -->
        <div class="text-sm text-gray-600">
          <span>by {{ submitterName }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatDate(submission?.submitted_at) }}</span>
        </div>
        
        <!-- Description (editable) -->
        <div class="relative">
          <div v-if="!editingDescription">
            <!-- Show description or prominent placeholder -->
            <div 
              v-if="submission?.metadata.description"
              class="text-sm text-gray-700 bg-gray-50 rounded p-2 group cursor-text prose prose-sm max-w-none"
              @click="canEditSubmission && startEditDescription()"
            >
              <div v-html="renderMarkdown(submission.metadata.description)" class="inline"></div>
              <button
                v-if="canEditSubmission"
                @click.stop="startEditDescription"
                class="ml-2 text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✏️ Edit
              </button>
            </div>
            <button
              v-else-if="canEditSubmission"
              @click="startEditDescription"
              class="text-sm text-gray-400 hover:text-gray-600 bg-gray-50 rounded p-2 w-full text-left border border-dashed border-gray-300"
            >
              + Add description for this submission
            </button>
            <div v-else class="text-sm text-gray-400 italic">
              No description
            </div>
          </div>
          <div v-else class="space-y-2">
            <textarea
              v-model="descriptionEdit"
              ref="descriptionTextarea"
              @keyup.ctrl.enter="saveDescription"
              @keyup.meta.enter="saveDescription"
              @keyup.esc="cancelEditDescription"
              rows="3"
              class="w-full px-3 py-2 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe what this conversation is about, what makes it interesting or noteworthy..."
            />
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">Ctrl/⌘ + Enter to save, Esc to cancel</span>
              <div class="flex gap-2">
                <button @click="cancelEditDescription" class="px-3 py-1.5 border border-gray-300 text-xs rounded hover:bg-gray-50">
                  Cancel
                </button>
                <button @click="saveDescription" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Research topic tags (editable) -->
        <div class="relative group">
          <div v-if="!editingTags" class="flex flex-wrap gap-2 items-center">
            <span v-if="!submission?.metadata.tags || submission.metadata.tags.length === 0" class="text-xs text-gray-400">
              No research topics
            </span>
            <button
              v-for="tag in submission?.metadata.tags || []"
              :key="tag"
              @click="router.push(`/topics?tag=${tag}`)"
              class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded hover:bg-indigo-100"
            >
              #{{ tag }}
            </button>
            <button
              v-if="canEditSubmission"
              @click="startEditTags"
              class="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✏️ {{ submission?.metadata.tags?.length ? 'Edit' : 'Add' }} topics
            </button>
          </div>
          <div v-else class="flex gap-2">
            <input
              v-model="tagsEdit"
              ref="tagsInput"
              @keyup.enter="saveTags"
              @keyup.esc="cancelEditTags"
              type="text"
              class="flex-1 px-2 py-1 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
              placeholder="research-topic, another-topic"
            />
            <button @click="saveTags" class="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
              Save
            </button>
            <button @click="cancelEditTags" class="px-2 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Submission-level comments (Scrollable area) -->
      <div class="px-4 pb-3 max-h-32 overflow-y-auto border-b border-gray-200">
        <div class="text-xs font-medium text-gray-600 mb-2">💬 Submission Comments</div>
        
        <div v-if="submissionComments.length === 0" class="text-xs text-gray-500">
          No general comments yet.
        </div>
        
        <div v-else class="space-y-2">
          <div
            v-for="comment in submissionComments"
            :key="comment.id"
            class="text-xs bg-gray-50 rounded p-2"
          >
            <div class="font-medium text-gray-700">{{ getUserName(comment.author_id) }}</div>
            <div class="text-gray-600">{{ comment.content }}</div>
          </div>
        </div>
        
        <button 
          class="text-xs text-indigo-600 hover:text-indigo-700 mt-2"
          @click="handleAddSubmissionComment"
        >
          + Add comment on submission
        </button>
      </div>
    </div>

    <!-- Main Content (below fixed header - dynamic padding) -->
    <div :style="{ paddingTop: contentPaddingTop }">
      <!-- Conversation (always visible) -->
      <div class="flex">
        <!-- Conversation (left side, 60%) -->
        <div class="flex-1 max-w-[60%] px-4" ref="conversationContainerEl">
          <MessageList
            v-if="messages.length > 0"
            :messages="messages"
            @annotate-message="handleAnnotateMessage"
            @start-multi-select="handleStartMultiSelect"
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
            :user-names="userNames"
            :current-user-id="authStore.user?.id"
            :can-moderate="canModerate"
            @add-tag="handleAddTag"
            @add-comment="handleAddCommentToSelection"
            @add-rating="handleAddRating"
            @delete-selection="handleDeleteSelection"
            @delete-comment="handleDeleteComment"
            @delete-rating="handleDeleteRating"
          />
        </div>
      </div>
    </div>

    <!-- Tag Picker Modal -->
    <TagPicker
      :show="showTagPicker"
      :ontologies-with-tags="ontologiesForPicker"
      :existing-tag-ids="activeSelectionId ? (selections.find(s => s.id === activeSelectionId)?.annotation_tags || []) : []"
      @apply="applyTags"
      @cancel="showTagPicker = false"
    />

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
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubmissionsStore } from '@/stores/submissions'
import MessageList from '@/components/MessageList.vue'
import AnnotationMargin from '@/components/AnnotationMargin.vue'
import CommentForm from '@/components/CommentForm.vue'
import TagPicker from '@/components/TagPicker.vue'
import type { Message, Selection, Comment, Rating } from '@/types'
import type { MarginAnnotation } from '@/utils/layout-manager'
import { ontologiesAPI, submissionsAPI, annotationsAPI } from '@/services/api'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const submissionsStore = useSubmissionsStore()

const submissionId = route.params.id as string
const loading = ref(true)
const isMobile = ref(window.innerWidth < 1024)

const submission = ref()
const messages = ref<Message[]>([])
const selections = ref<Selection[]>([])
const selectionData = ref<Map<string, {
  comments: Comment[]
  ratings: Rating[]
  tags: any[]
}>>(new Map())
const attachedOntologies = ref<any[]>([])
const allTags = ref<Map<string, any>>(new Map())
const submitterName = ref('User')
const submissionComments = ref<Comment[]>([])
const userNames = ref<Map<string, string>>(new Map())

const editingDescription = ref(false)
const descriptionEdit = ref('')
const descriptionTextarea = ref<HTMLTextAreaElement>()
const editingTags = ref(false)
const tagsEdit = ref('')
const tagsInput = ref<HTMLInputElement>()

const canEditSubmission = computed(() => {
  if (!authStore.user || !submission.value) return false
  return submission.value.submitter_id === authStore.user.id || 
         authStore.user.roles.includes('researcher') ||
         authStore.user.roles.includes('admin')
})

const canModerate = computed(() => {
  if (!authStore.user) return false
  return authStore.user.roles.includes('researcher') || 
         authStore.user.roles.includes('admin')
})

const contentPaddingTop = computed(() => {
  const base = headerHeight.value + 20 // 20px extra spacing
  const toolbar = showSelectionToolbar.value ? 60 : 0
  return `${base + toolbar}px`
})


onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await loadData()
  
  // Measure header height after render
  setTimeout(() => {
    if (headerEl.value) {
      headerHeight.value = headerEl.value.offsetHeight
    }
  }, 100)
  
  // Also recalculate when description changes
  watch([editingDescription, editingTags], () => {
    setTimeout(() => {
      if (headerEl.value) {
        headerHeight.value = headerEl.value.offsetHeight
      }
    }, 50)
  })
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

async function loadData() {
  loading.value = true
  try {
    // Load basic submission data
    submission.value = await submissionsStore.fetchSubmission(submissionId)
    messages.value = await submissionsStore.fetchMessages(submissionId)
    selections.value = await submissionsStore.fetchSelections(submissionId)
    
    // Build user names map (for now just current user)
    userNames.value.clear()
    if (authStore.user) {
      userNames.value.set(authStore.user.id, authStore.user.name)
      submitterName.value = authStore.user.id === submission.value.submitter_id 
        ? authStore.user.name 
        : 'User ' + submission.value.submitter_id.substring(0, 8)
    }
    
    // Load ontologies and tags
    const ontoResponse = await ontologiesAPI.getForSubmission(submissionId)
    attachedOntologies.value = ontoResponse.data.ontologies
    
    // Build tag map
    allTags.value.clear()
    for (const onto of attachedOntologies.value) {
      const ontoDetail = await ontologiesAPI.get(onto.ontology_id)
      ontoDetail.data.tags.forEach((tag: any) => {
        allTags.value.set(tag.id, tag)
      })
    }
    
    // Load comments and ratings for each selection
    selectionData.value.clear()
    for (const sel of selections.value) {
      const comments = await submissionsStore.getCommentsBySelection(sel.id)
      const ratings = await submissionsStore.getRatingsBySelection(sel.id)
      const tags = sel.annotation_tags.map(tagId => allTags.value.get(tagId)).filter(t => t)
      
      selectionData.value.set(sel.id, { comments, ratings, tags })
    }
    
    // TODO: Load submission-level comments
    submissionComments.value = []
    
  } catch (err) {
    console.error('Failed to load submission:', err)
  } finally {
    loading.value = false
  }
}

async function handleAnnotateMessage(messageId: string) {
  // Create selection immediately for this message
  try {
    const selection = await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: messageId,
      end_message_id: messageId,
      start_offset: undefined,
      end_offset: undefined,
      label: undefined
    })
    
    selections.value.push(selection)
    selectionData.value.set(selection.id, { comments: [], ratings: [], tags: [] })
  } catch (err) {
    console.error('Failed to create annotation:', err)
  }
}

function handleStartMultiSelect(messageId: string) {
  // Just enters multi-select mode - handled by MessageList
}

const showCommentForm = ref(false)
const showTagPicker = ref(false)
const activeSelectionId = ref<string | null>(null)
const commentContext = ref<{ messageId: string; text?: string; selectionId?: string } | null>(null)
const conversationContainerEl = ref<HTMLElement | null>(null)
const showSelectionToolbar = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const headerHeight = ref(280)

// Computed helpers
const totalCommentCount = computed(() => {
  let count = 0
  for (const data of selectionData.value.values()) {
    count += data.comments.length
  }
  return count
})

const totalRatingCount = computed(() => {
  let count = 0
  for (const data of selectionData.value.values()) {
    count += data.ratings.length
  }
  return count
})

const selectionsWithComments = computed(() => {
  return selections.value.filter(sel => {
    const data = selectionData.value.get(sel.id)
    return data && data.comments.length > 0
  })
})

function getCommentsForSelection(selectionId: string) {
  return selectionData.value.get(selectionId)?.comments || []
}

// Ontologies for tag picker
const ontologiesForPicker = computed(() => {
  return attachedOntologies.value.map(subOnto => {
    const tags = Array.from(allTags.value.values()).filter(t => t.ontology_id === subOnto.ontology_id)
    return {
      ontology: { name: 'Ontology', id: subOnto.ontology_id } as any,
      tags
    }
  })
})

// Build margin annotations - one unified card per selection
const marginAnnotations = computed<MarginAnnotation[]>(() => {
  const annotations: MarginAnnotation[] = []
  
  for (const sel of selections.value) {
    const data = selectionData.value.get(sel.id)
    if (!data) continue
    
    annotations.push({
      id: sel.id,
      type: 'selection',
      anchorMessageId: sel.start_message_id,
      priority: 5,
      minHeight: 100,
      data: {
        selection: sel,
        tags: data.tags,
        comments: data.comments,
        ratings: data.ratings
      }
    })
  }
  
  return annotations
})

// Annotations are now created directly, no form needed

async function submitComment(text: string) {
  try {
    let targetSelectionId: string
    
    // If activeSelectionId is set (from unified card), use it
    if (activeSelectionId.value) {
      targetSelectionId = activeSelectionId.value
    } else if (commentContext.value) {
      // Otherwise auto-create selection for message
      const selection = await submissionsStore.createSelection({
        submission_id: submissionId,
        start_message_id: commentContext.value.messageId,
        end_message_id: commentContext.value.messageId,
        start_offset: undefined,
        end_offset: undefined,
        label: undefined
      })
      
      targetSelectionId = selection.id
      selections.value.push(selection)
      selectionData.value.set(selection.id, { comments: [], ratings: [], tags: [] })
    } else {
      showCommentForm.value = false
      return
    }
    
    // Create comment
    const comment = await submissionsStore.createComment({
      selection_id: targetSelectionId,
      content: text
    })
    
    // Update just this selection's comments
    const data = selectionData.value.get(targetSelectionId)
    if (data) {
      data.comments.push(comment)
    }
    
    showCommentForm.value = false
    commentContext.value = null
    activeSelectionId.value = null
  } catch (err) {
    console.error('Failed to create comment:', err)
    showCommentForm.value = false
    commentContext.value = null
    activeSelectionId.value = null
  }
}

function getUserName(userId: string) {
  if (userId === authStore.user?.id) {
    return authStore.user.name
  }
  // TODO: Look up from user cache/API
  return 'User ' + userId.substring(0, 8)
}

function handleAddSubmissionComment() {
  console.log('Add submission comment')
  // TODO: Implement submission-level comments
}

function startEditDescription() {
  descriptionEdit.value = submission.value?.metadata.description || ''
  editingDescription.value = true
  setTimeout(() => descriptionTextarea.value?.focus(), 10)
}

async function saveDescription() {
  try {
    await submissionsAPI.update(submissionId, { description: descriptionEdit.value })
    
    if (submission.value) {
      submission.value.metadata.description = descriptionEdit.value
    }
    editingDescription.value = false
  } catch (err) {
    console.error('Failed to save description:', err)
  }
}

function cancelEditDescription() {
  editingDescription.value = false
  descriptionEdit.value = ''
}

function startEditTags() {
  tagsEdit.value = submission.value?.metadata.tags?.join(', ') || ''
  editingTags.value = true
  setTimeout(() => tagsInput.value?.focus(), 10)
}

async function saveTags() {
  try {
    const tags = tagsEdit.value.split(',').map(t => t.trim()).filter(t => t)
    await submissionsAPI.update(submissionId, { tags })
    
    if (submission.value) {
      submission.value.metadata.tags = tags
    }
    editingTags.value = false
  } catch (err) {
    console.error('Failed to save tags:', err)
  }
}

function cancelEditTags() {
  editingTags.value = false
  tagsEdit.value = ''
}

function handleAddTag(selectionId: string) {
  activeSelectionId.value = selectionId
  showTagPicker.value = true
}

function handleAddCommentToSelection(selectionId: string) {
  activeSelectionId.value = selectionId
  showCommentForm.value = true
}

function handleAddRating(selectionId: string) {
  activeSelectionId.value = selectionId
  console.log('Rate selection:', selectionId)
  // TODO: Open rating form
}

async function handleDeleteSelection(selectionId: string) {
  if (!confirm('Delete this selection and all its comments/ratings?')) return
  
  try {
    await annotationsAPI.deleteSelection(selectionId)
    
    // Remove from UI
    selections.value = selections.value.filter(s => s.id !== selectionId)
    selectionData.value.delete(selectionId)
  } catch (err) {
    console.error('Failed to delete selection:', err)
  }
}

async function handleDeleteComment(commentId: string) {
  if (!confirm('Delete this comment?')) return
  
  try {
    await annotationsAPI.deleteComment(commentId)
    
    // Remove from all selections' comments
    for (const data of selectionData.value.values()) {
      data.comments = data.comments.filter(c => c.id !== commentId)
    }
  } catch (err) {
    console.error('Failed to delete comment:', err)
  }
}

async function handleDeleteRating(ratingId: string) {
  if (!confirm('Delete this rating?')) return
  
  try {
    await annotationsAPI.deleteRating(ratingId)
    
    // Remove from all selections' ratings
    for (const data of selectionData.value.values()) {
      data.ratings = data.ratings.filter(r => r.id !== ratingId)
    }
  } catch (err) {
    console.error('Failed to delete rating:', err)
  }
}

async function applyTags(tagIds: string[]) {
  if (!activeSelectionId.value) return
  
  try {
    await ontologiesAPI.applyTags(activeSelectionId.value, tagIds)
    
    // Update just this selection's data
    const sel = selections.value.find(s => s.id === activeSelectionId.value)
    if (sel) {
      sel.annotation_tags = tagIds
      const data = selectionData.value.get(activeSelectionId.value!)
      if (data) {
        data.tags = tagIds.map(tagId => allTags.value.get(tagId)).filter(t => t)
      }
    }
    
    showTagPicker.value = false
    activeSelectionId.value = null
  } catch (err) {
    console.error('Failed to apply tags:', err)
    showTagPicker.value = false
    activeSelectionId.value = null
  }
}

function formatDate(date?: string) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString()
}
</script>


