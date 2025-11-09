<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 dark:bg-gray-950 transition-colors">
    <!-- Fixed Top Pane -->
    <div class="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 dark:border-gray-800 z-30 transition-colors" ref="headerEl">
      <!-- Navigation Bar -->
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div class="flex items-center justify-between">
          <button @click="router.push('/')" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 dark:hover:text-gray-100 transition-colors">
            ← Back to Browse
          </button>
          <div class="flex items-center gap-3">
            <button
              v-if="canDeleteSubmission"
              @click="handleDeleteSubmission"
              class="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 border border-red-300 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              🗑️ Delete Submission
            </button>
            <div v-if="authStore.isAuthenticated()" class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-300">
              {{ authStore.user?.name }}
            </div>
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
        <div class="text-sm text-gray-600 dark:text-gray-400">
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
              class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 rounded p-2 group cursor-text prose prose-sm max-w-none"
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
              class="text-sm text-gray-400 hover:text-gray-600 bg-gray-50 dark:bg-gray-950 rounded p-2 w-full text-left border border-dashed border-gray-300 dark:border-gray-700"
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
              <span class="text-xs text-gray-500 dark:text-gray-400">Ctrl/⌘ + Enter to save, Esc to cancel</span>
              <div class="flex gap-2">
                <button @click="cancelEditDescription" class="px-3 py-1.5 border border-gray-300 dark:border-gray-700 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  Cancel
                </button>
                <button @click="saveDescription" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Research topic tags (editable with multiselect) -->
        <div class="relative group">
          <div class="flex flex-wrap gap-2 items-center">
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
              @click="showTopicSelector = true"
              class="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✏️ {{ submission?.metadata.tags?.length ? 'Edit' : 'Add' }} topics
            </button>
          </div>
        </div>
      </div>

      <!-- Two-column: Stats/Info | Actions -->
      <div class="px-4 pb-3 border-t border-gray-200 dark:border-gray-800">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 py-3">
          <!-- Left: Stats (compact) -->
          <div class="space-y-2">
            <!-- Rating Stats -->
            <div v-if="ratingStats.length > 0" class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">⭐ Ratings:</span>
                <button
                  @click="showStatsDetail = true"
                  class="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Details →
                </button>
              </div>
              <div class="flex flex-wrap gap-3 text-xs">
                <div
                  v-for="stat in ratingStats.slice(0, 3)"
                  :key="stat.criterion_id"
                  class="flex items-center gap-1"
                >
                  <span class="text-gray-700">{{ stat.criterion_name }}:</span>
                  <span class="font-semibold text-indigo-600">{{ stat.avg.toFixed(1) }}/{{ stat.max }}</span>
                  <span class="text-gray-500">({{ stat.count }})</span>
                </div>
                <span v-if="ratingStats.length > 3" class="text-gray-500">
                  +{{ ratingStats.length - 3 }} more
                </span>
              </div>
            </div>

            <!-- Tag Stats -->
            <div v-if="tagStats.length > 0" class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">🏷️ Tags:</span>
                <button
                  @click="showStatsDetail = true"
                  class="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Details →
                </button>
              </div>
              <div class="flex flex-wrap gap-2 text-xs">
                <span
                  v-for="stat in tagStats.slice(0, 5)"
                  :key="stat.tag_id"
                  class="bg-gray-100 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {{ stat.tag_name }} <span class="text-gray-500">({{ stat.count }})</span>
                </span>
                <span v-if="tagStats.length > 5" class="text-gray-500 px-2 py-1">
                  +{{ tagStats.length - 5 }} more
                </span>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="ratingStats.length === 0 && tagStats.length === 0" class="text-xs text-gray-500 dark:text-gray-400 py-1">
              No ratings or annotations yet. Start annotating! →
            </div>
          </div>

          <!-- Right: Actions -->
          <div class="flex flex-col gap-2 lg:min-w-[180px]">
            <button 
              @click="showRatingForm = true"
              class="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium whitespace-nowrap"
            >
              ⭐ Rate Submission
            </button>
            <div v-if="submissionRatings.length > 0" class="text-xs text-gray-500 dark:text-gray-400 text-center">
              {{ submissionRatings.length }} rating(s)
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content (below fixed header - dynamic padding) -->
    <div :style="{ paddingTop: contentPaddingTop }" class="min-h-screen">
      <!-- Two-column layout for desktop, single column for mobile -->
      <div class="flex flex-col lg:flex-row">
        <!-- Conversation (full width mobile, 60% desktop) -->
        <div class="w-full lg:w-[60%] px-4" ref="conversationContainerEl">
          <MessageList
            v-if="messages.length > 0"
            :messages="messages"
            :annotated-message-ids="annotatedMessageIds"
            :inline-annotations="isMobile ? inlineAnnotations : new Map()"
            :user-names="userNames"
            :current-user-id="authStore.user?.id"
            :can-moderate="canModerate"
            @annotate-message="handleAnnotateMessage"
            @start-multi-select="handleStartMultiSelect"
            @selection-mode-changed="showSelectionToolbar = $event"
            @add-tag="handleAddTag"
            @add-tag-vote="handleAddTagVote"
            @add-comment="handleAddCommentToSelection"
            @delete-selection="handleDeleteSelection"
            @delete-comment="handleDeleteComment"
            @remove-tag="handleRemoveTag"
          />
          <div v-else class="p-8 text-center text-gray-500 dark:text-gray-400">
            <div v-if="loading">Loading conversation...</div>
            <div v-else>No messages found</div>
          </div>
        </div>

        <!-- Annotation Margin (hidden on mobile, 40% on desktop) -->
        <div class="hidden lg:block lg:w-[40%] relative">
          <AnnotationMargin
            :annotations="marginAnnotations"
            :conversation-el="conversationContainerEl"
            :user-names="userNames"
            :current-user-id="authStore.user?.id"
            :can-moderate="canModerate"
            @add-tag="handleAddTag"
            @add-tag-vote="handleAddTagVote"
            @add-comment="handleAddCommentToSelection"
            @delete-selection="handleDeleteSelection"
            @delete-comment="handleDeleteComment"
            @remove-tag="handleRemoveTag"
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

    <!-- Topic Selector Modal -->
    <TopicSelector
      :show="showTopicSelector"
      :topics="availableTopics"
      :selected-topic-names="submission?.metadata.tags || []"
      @apply="applyTopics"
      @cancel="showTopicSelector = false"
    />

    <!-- Rating Form Modal -->
    <RatingForm
      :show="showRatingForm"
      :ranking-systems-with-criteria="rankingSystemsForPicker"
      @submit="submitRatings"
      @cancel="showRatingForm = false"
    />

    <!-- Comment Form Modal -->
    <CommentForm
      :show="showCommentForm"
      :selected-text="commentContext?.text"
      @submit="submitComment"
      @cancel="showCommentForm = false"
    />

    <!-- Stats Detail Modal -->
    <div
      v-if="showStatsDetail"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50"
      @click.self="showStatsDetail = false"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col transition-colors">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Annotation Statistics</h2>
          <button
            @click="showStatsDetail = false"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Rating Stats Detail -->
          <div v-if="ratingStats.length > 0">
            <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">⭐ Rating Breakdown</h3>
            <div class="space-y-4">
              <div
                v-for="stat in ratingStats"
                :key="stat.criterion_id"
                class="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <div class="flex items-baseline justify-between mb-2">
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ stat.criterion_name }}</span>
                  <span class="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {{ stat.avg.toFixed(1) }}/{{ stat.max }}
                  </span>
                </div>
                <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {{ stat.count }} rating(s) • Range: {{ Math.min(...stat.scores) }}–{{ Math.max(...stat.scores) }}
                </div>
                <!-- Simple histogram -->
                <div class="flex gap-1 h-12 items-end">
                  <div
                    v-for="score in Array.from({ length: stat.max + 1 }, (_, i) => i)"
                    :key="score"
                    class="flex-1 bg-indigo-200 dark:bg-indigo-700 rounded-t transition-colors"
                    :style="{ 
                      height: (stat.scores.filter(s => s === score).length / stat.count * 100) + '%',
                      minHeight: stat.scores.filter(s => s === score).length > 0 ? '4px' : '0'
                    }"
                    :title="`${score}: ${stat.scores.filter(s => s === score).length} rating(s)`"
                  ></div>
                </div>
                <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>0</span>
                  <span>{{ stat.max }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tag Stats Detail -->
          <div v-if="tagStats.length > 0">
            <h3 class="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">🏷️ Tag Usage</h3>
            <div class="grid grid-cols-2 gap-3">
              <div
                v-for="stat in tagStats"
                :key="stat.tag_id"
                class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ stat.tag_name }}</span>
                <span class="text-lg font-bold text-gray-600 dark:text-gray-400">{{ stat.count }}</span>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="ratingStats.length === 0 && tagStats.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
            No statistics available yet.
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button
            @click="showStatsDetail = false"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
import TopicSelector from '@/components/TopicSelector.vue'
import RatingForm from '@/components/RatingForm.vue'
import type { Message, Selection, Comment, Rating, Topic } from '@/types'
import type { MarginAnnotation } from '@/utils/layout-manager'
import { ontologiesAPI, submissionsAPI, annotationsAPI, researchAPI, rankingsAPI, authAPI } from '@/services/api'
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
  tags: any[]
}>>(new Map())
const submissionRatings = ref<Rating[]>([])
const attachedOntologies = ref<any[]>([])
const allTags = ref<Map<string, any>>(new Map())
const submitterName = ref('User')
const submissionComments = ref<Comment[]>([])
const userNames = ref<Map<string, string>>(new Map())

const editingDescription = ref(false)
const descriptionEdit = ref('')
const descriptionTextarea = ref<HTMLTextAreaElement>()
const showTopicSelector = ref(false)
const availableTopics = ref<Topic[]>([])

const canEditSubmission = computed(() => {
  if (!authStore.user || !submission.value) return false
  return submission.value.submitter_id === authStore.user.id || 
         authStore.user.roles.includes('researcher') ||
         authStore.user.roles.includes('admin')
})

const canDeleteSubmission = computed(() => {
  if (!authStore.user || !submission.value) return false
  return submission.value.submitter_id === authStore.user.id || 
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

// Track which messages have annotations
const annotatedMessageIds = computed(() => {
  const ids = new Set<string>()
  for (const sel of selections.value) {
    ids.add(sel.start_message_id)
    // If spans multiple, add all in range
    if (sel.end_message_id !== sel.start_message_id) {
      const startIdx = messages.value.findIndex(m => m.id === sel.start_message_id)
      const endIdx = messages.value.findIndex(m => m.id === sel.end_message_id)
      for (let i = startIdx; i <= endIdx && i >= 0; i++) {
        ids.add(messages.value[i].id)
      }
    }
  }
  return ids
})


onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await loadData()
  
  // Use ResizeObserver to track header height changes
  const updateHeaderHeight = () => {
    if (headerEl.value) {
      headerHeight.value = headerEl.value.offsetHeight
    }
  }
  
  // Initial measurement
  setTimeout(updateHeaderHeight, 100)
  
  // Watch for any changes that might affect header height
  watch([editingDescription], () => {
    setTimeout(updateHeaderHeight, 50)
  })
  
  // Use ResizeObserver for continuous tracking
  if (headerEl.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateHeaderHeight()
    })
    resizeObserver.observe(headerEl.value)
  }
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
    
    // Load available topics for selector
    const topicsResponse = await researchAPI.getTopics()
    availableTopics.value = topicsResponse.data.topics
    
    // Build user names map - collect all user IDs from all sources
    userNames.value.clear()
    const allUserIds = new Set<string>()
    
    // Add submission creator
    allUserIds.add(submission.value.submitter_id)
    
    // Add all selection creators
    selections.value.forEach(sel => allUserIds.add(sel.created_by))
    
    // Add all tag contributors (from tag_attributions)
    selections.value.forEach(sel => {
      if (sel.tag_attributions) {
        sel.tag_attributions.forEach(attr => allUserIds.add(attr.tagged_by))
      }
    })
    
    // We'll add comment authors after loading comments below
    
    // Add current user
    if (authStore.user) {
      allUserIds.add(authStore.user.id)
    }
    
    // Fetch all user names from API
    if (allUserIds.size > 0) {
      try {
        const response = await authAPI.getUserNames(Array.from(allUserIds))
        Object.entries(response.data.user_names).forEach(([userId, name]) => {
          userNames.value.set(userId, name)
        })
      } catch (err) {
        console.error('Failed to load user names:', err)
      }
    }
    
    submitterName.value = userNames.value.get(submission.value.submitter_id) || 'User'
    
    // Load ontologies and tags (combines topic-derived + explicit)
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
    
    // Load ranking systems and criteria (combines topic-derived + explicit)
    const rankingsResponse = await rankingsAPI.getForSubmission(submissionId)
    attachedRankingSystems.value = rankingsResponse.data.ranking_systems
    
    // Build criteria map and store system details
    allCriteria.value.clear()
    rankingSystemDetails.value.clear()
    for (const rankingSystem of attachedRankingSystems.value) {
      const systemDetail = await rankingsAPI.get(rankingSystem.ranking_system_id)
      rankingSystemDetails.value.set(rankingSystem.ranking_system_id, systemDetail)
      systemDetail.data.criteria.forEach((criterion: any) => {
        allCriteria.value.set(criterion.id, criterion)
      })
    }
    
    // Load comments and tags for each selection
    selectionData.value.clear()
    for (const sel of selections.value) {
      const comments = await submissionsStore.getCommentsBySelection(sel.id)
      
      // Add comment authors to user IDs set
      comments.forEach(c => allUserIds.add(c.author_id))
      
      // Use tag_attributions if available (new), fallback to annotation_tags (old)
      const tagIds = sel.tag_attributions 
        ? sel.tag_attributions.map(a => a.tag_id)
        : sel.annotation_tags
      const tags = tagIds.map(tagId => allTags.value.get(tagId)).filter(t => t)
      
      selectionData.value.set(sel.id, { comments, tags })
    }
    
    // Now fetch user names for comment authors too
    if (allUserIds.size > userNames.value.size) {
      try {
        const newUserIds = Array.from(allUserIds).filter(id => !userNames.value.has(id))
        if (newUserIds.length > 0) {
          const response = await authAPI.getUserNames(newUserIds)
          Object.entries(response.data.user_names).forEach(([userId, name]) => {
            userNames.value.set(userId, name)
          })
        }
      } catch (err) {
        console.error('Failed to load additional user names:', err)
      }
    }
    
    // Load submission-level ratings
    submissionRatings.value = await submissionsStore.getRatingsBySubmission(submissionId)
    
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
    selectionData.value.set(selection.id, { comments: [], tags: [] })
  } catch (err) {
    console.error('Failed to create annotation:', err)
  }
}

function handleStartMultiSelect(messageId: string) {
  // Just enters multi-select mode - handled by MessageList
}

const showCommentForm = ref(false)
const showTagPicker = ref(false)
const showRatingForm = ref(false)
const showStatsDetail = ref(false)
const activeSelectionId = ref<string | null>(null)
const commentContext = ref<{ messageId: string; text?: string; selectionId?: string } | null>(null)
const conversationContainerEl = ref<HTMLElement | null>(null)
const showSelectionToolbar = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const headerHeight = ref(0)
const attachedRankingSystems = ref<any[]>([])
const allCriteria = ref<Map<string, any>>(new Map())

// Computed helpers
const totalCommentCount = computed(() => {
  let count = 0
  for (const data of selectionData.value.values()) {
    count += data.comments.length
  }
  return count
})

const totalRatingCount = computed(() => {
  return submissionRatings.value.length
})

// Rating statistics
const ratingStats = computed(() => {
  const stats = new Map<string, { criterion_id: string; criterion_name: string; scores: number[]; max: number }>()
  
  for (const rating of submissionRatings.value) {
    const criterion = allCriteria.value.get(rating.criterion_id)
    if (!criterion) continue
    
    if (!stats.has(rating.criterion_id)) {
      stats.set(rating.criterion_id, {
        criterion_id: rating.criterion_id,
        criterion_name: criterion.name,
        scores: [],
        max: criterion.scale_max
      })
    }
    stats.get(rating.criterion_id)!.scores.push(rating.score)
  }
  
  return Array.from(stats.values()).map(stat => ({
    criterion_id: stat.criterion_id,
    criterion_name: stat.criterion_name,
    avg: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
    count: stat.scores.length,
    max: stat.max,
    scores: stat.scores
  })).sort((a, b) => b.count - a.count)
})

// Tag statistics
const tagStats = computed(() => {
  const stats = new Map<string, { tag_id: string; tag_name: string; count: number }>()
  
  for (const selection of selections.value) {
    for (const tagId of selection.annotation_tags) {
      const tag = allTags.value.get(tagId)
      if (!tag) continue
      
      if (!stats.has(tagId)) {
        stats.set(tagId, {
          tag_id: tagId,
          tag_name: tag.name,
          count: 0
        })
      }
      stats.get(tagId)!.count++
    }
  }
  
  return Array.from(stats.values()).sort((a, b) => b.count - a.count)
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

// Ranking systems for rating picker - need to store full system details
const rankingSystemDetails = ref<Map<string, any>>(new Map())

// Ranking systems for rating picker
const rankingSystemsForPicker = computed(() => {
  return attachedRankingSystems.value.map(subRanking => {
    const systemDetail = rankingSystemDetails.value.get(subRanking.ranking_system_id)
    const criteria = Array.from(allCriteria.value.values()).filter(c => c.ranking_system_id === subRanking.ranking_system_id)
    return {
      system: systemDetail?.data.ranking_system || { name: 'Ranking System', id: subRanking.ranking_system_id },
      criteria,
      isFromTopic: subRanking.source === 'topic'  // From dynamic lookup
    }
  })
})

// Build margin annotations - one card per selection (no ratings)
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
        tagAttributions: sel.tag_attributions || [], // Include tag attributions
        ratings: [] // Ratings are submission-level now
      }
    })
  }
  
  return annotations
})

// Build inline annotations for mobile (grouped by message)
const inlineAnnotations = computed(() => {
  const annotationsByMessage = new Map<string, any[]>()
  
  for (const sel of selections.value) {
    const data = selectionData.value.get(sel.id)
    if (!data) continue
    
    const messageId = sel.start_message_id
    if (!annotationsByMessage.has(messageId)) {
      annotationsByMessage.set(messageId, [])
    }
    
    annotationsByMessage.get(messageId)!.push({
      selection: sel,
      tags: data.tags,
      comments: data.comments,
      tagAttributions: sel.tag_attributions || []
    })
  }
  
  return annotationsByMessage
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
      selectionData.value.set(selection.id, { comments: [], tags: [] })
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

async function applyTopics(topicNames: string[]) {
  try {
    await submissionsAPI.update(submissionId, { tags: topicNames })
    
    if (submission.value) {
      submission.value.metadata.tags = topicNames
    }
    showTopicSelector.value = false
  } catch (err) {
    console.error('Failed to save topics:', err)
    showTopicSelector.value = false
  }
}

function handleAddTag(selectionId: string) {
  activeSelectionId.value = selectionId
  showTagPicker.value = true
}

async function handleAddTagVote(selectionId: string, tagId: string) {
  try {
    // Add vote by applying just this one tag (will add to existing)
    await ontologiesAPI.applyTags(selectionId, [tagId])
    
    // Refresh selection to get updated attributions
    const updatedSelections = await annotationsAPI.getSelections(submissionId)
    const updatedSel = updatedSelections.data.selections.find(s => s.id === selectionId)
    
    if (updatedSel) {
      // Update selection in main list
      const idx = selections.value.findIndex(s => s.id === selectionId)
      if (idx !== -1) {
        selections.value[idx] = updatedSel
      }
      
      // Update selection data
      const data = selectionData.value.get(selectionId)
      if (data) {
        const tagIds = updatedSel.tag_attributions 
          ? updatedSel.tag_attributions.map(a => a.tag_id)
          : updatedSel.annotation_tags
        data.tags = tagIds.map(tagId => allTags.value.get(tagId)).filter(t => t) as any[]
      }
      
      // Update user names for any new contributors
      if (updatedSel.tag_attributions) {
        const newUserIds = updatedSel.tag_attributions
          .map(a => a.tagged_by)
          .filter(id => !userNames.value.has(id))
        
        if (newUserIds.length > 0) {
          try {
            const response = await authAPI.getUserNames(newUserIds)
            Object.entries(response.data.user_names).forEach(([userId, name]) => {
              userNames.value.set(userId, name)
            })
          } catch (err) {
            console.error('Failed to load user names:', err)
          }
        }
      }
    }
  } catch (err) {
    console.error('Failed to add tag vote:', err)
  }
}

function handleAddCommentToSelection(selectionId: string) {
  activeSelectionId.value = selectionId
  showCommentForm.value = true
}

function handleAddRating(selectionId: string) {
  // Ratings are submission-level now, but can still be triggered from annotation card
  showRatingForm.value = true
}

async function submitRatings(ratings: Array<{ criterion_id: string; score: number }>) {
  try {
    // Submit all ratings at submission level
    for (const rating of ratings) {
      await submissionsStore.createRating({
        submission_id: submissionId,
        criterion_id: rating.criterion_id,
        score: rating.score
      })
    }
    
    // Refresh submission ratings
    submissionRatings.value = await submissionsStore.getRatingsBySubmission(submissionId)
    
    showRatingForm.value = false
  } catch (err) {
    console.error('Failed to submit ratings:', err)
    showRatingForm.value = false
  }
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

async function handleRemoveTag(selectionId: string, tagId: string) {
  try {
    await annotationsAPI.removeTag(selectionId, tagId)
    
    // Refresh selection to get updated vote counts
    const updatedSelections = await annotationsAPI.getSelections(submissionId)
    const updatedSel = updatedSelections.data.selections.find(s => s.id === selectionId)
    
    if (updatedSel) {
      // Update selection in main list
      const idx = selections.value.findIndex(s => s.id === selectionId)
      if (idx !== -1) {
        selections.value[idx] = updatedSel
      }
      
      // Update selection data using tag_attributions
      const data = selectionData.value.get(selectionId)
      if (data) {
        const tagIds = updatedSel.tag_attributions 
          ? updatedSel.tag_attributions.map(a => a.tag_id)
          : updatedSel.annotation_tags
        // Get unique tag IDs for display
        const uniqueTagIds = [...new Set(tagIds)]
        data.tags = uniqueTagIds.map(tagId => allTags.value.get(tagId)).filter(t => t) as any[]
      }
    }
  } catch (err) {
    console.error('Failed to remove tag:', err)
  }
}

async function handleDeleteRating(ratingId: string) {
  if (!confirm('Delete this rating?')) return
  
  try {
    await annotationsAPI.deleteRating(ratingId)
    
    // Remove from submission ratings
    submissionRatings.value = submissionRatings.value.filter(r => r.id !== ratingId)
  } catch (err) {
    console.error('Failed to delete rating:', err)
  }
}

async function handleDeleteSubmission() {
  const confirmed = confirm(
    'Delete this submission?\n\n' +
    'This will mark it as deleted and remove it from browse listings. ' +
    'The data will be preserved for archival purposes.\n\n' +
    'This action cannot be undone.'
  )
  
  if (!confirmed) return
  
  try {
    await submissionsAPI.delete(submissionId)
    // Navigate back to browse
    router.push('/')
  } catch (err: any) {
    console.error('Failed to delete submission:', err)
    alert('Failed to delete submission: ' + (err.response?.data?.error || err.message))
  }
}

async function applyTags(tagIds: string[]) {
  if (!activeSelectionId.value) return
  
  try {
    await ontologiesAPI.applyTags(activeSelectionId.value, tagIds)
    
    // Refresh the selection to get updated tag attributions from server
    const updatedSelections = await annotationsAPI.getSelections(submissionId)
    const updatedSel = updatedSelections.data.selections.find(s => s.id === activeSelectionId.value)
    
    if (updatedSel) {
      // Update selection in main list
      const idx = selections.value.findIndex(s => s.id === activeSelectionId.value)
      if (idx !== -1) {
        selections.value[idx] = updatedSel
      }
      
      // Update selection data using tag_attributions
      const data = selectionData.value.get(activeSelectionId.value!)
      if (data) {
        const tagIds = updatedSel.tag_attributions 
          ? updatedSel.tag_attributions.map(a => a.tag_id)
          : updatedSel.annotation_tags
        data.tags = tagIds.map(tagId => allTags.value.get(tagId)).filter(t => t) as any[]
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


