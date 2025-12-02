<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 transition-colors">
    <!-- Compact Header -->
    <div class="fixed top-0 left-0 right-0 bg-gray-900/80 dark:bg-gray-950/80 backdrop-blur-xl border-b border-gray-700/50 dark:border-gray-800/50 z-30 transition-all" ref="headerEl">
      <div class="px-6 py-3">
        <div class="flex items-center gap-4">
          <!-- Back button -->
          <button 
            @click="router.push('/browse')" 
            class="text-gray-400 hover:text-white transition-colors text-sm opacity-70 hover:opacity-100"
          >
            ← Back
          </button>
          
          <!-- Title + metadata inline -->
          <div class="flex-1 flex items-baseline gap-3 min-w-0">
            <!-- Editable title -->
            <div v-if="!editingTitle" class="flex items-center gap-2 group min-w-0">
              <h1 
                class="text-lg font-medium text-white truncate"
                :class="{ 'cursor-pointer hover:text-indigo-300 transition-colors': canEditSubmission }"
                @click="canEditSubmission && startEditTitle()"
              >
              {{ submission?.title || 'Loading...' }}
            </h1>
              <button
                v-if="canEditSubmission"
                @click.stop="startEditTitle"
                class="text-xs text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                title="Edit title"
              >
                ✏️
              </button>
            </div>
            <!-- Title edit input -->
            <div v-else class="flex items-center gap-2 flex-1 min-w-0">
              <input
                v-model="titleEdit"
                ref="titleInput"
                type="text"
                @keyup.enter="saveTitle"
                @keyup.esc="cancelEditTitle"
                @blur="saveTitle"
                class="flex-1 px-2 py-1 text-lg font-medium bg-gray-800/50 border border-gray-600/50 text-white rounded focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 min-w-0"
                placeholder="Conversation title..."
              />
            </div>
            <span class="text-xs text-gray-400 opacity-60">by {{ submitterName }}</span>
            <span class="text-xs text-gray-500 opacity-50">•</span>
            <span class="text-xs text-gray-400 opacity-60">{{ formatDate(submission?.submitted_at) }}</span>
          </div>
          
          <!-- Topic tags inline -->
          <div class="flex gap-1.5" v-if="submission?.metadata.tags?.length > 0">
            <button
              v-for="tag in submission?.metadata.tags"
              :key="tag"
              @click="router.push(`/topics?tag=${tag}`)"
              class="px-2 py-0.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs rounded transition-all"
            >
              #{{ tag }}
            </button>
          </div>
          
          <!-- Stats pills -->
          <div class="flex items-center gap-2">
            <!-- Per-system rating averages -->
            <div
              v-for="sysRating in systemRatingAverages"
              :key="sysRating.system_id"
              class="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs rounded-full font-mono flex items-center gap-1"
              :title="`${sysRating.system_name}: ${sysRating.avg.toFixed(1)}/${sysRating.max} (${sysRating.count} ratings)`"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span class="uppercase">{{ abbreviate(sysRating.system_name) }}</span>
              <span class="font-semibold">{{ sysRating.avg.toFixed(1) }}</span>
            </div>
            <div v-if="tagStats.length > 0" class="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs rounded-full font-mono flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              {{ tagStats.length }}
            </div>
            <div v-if="totalCommentCount > 0" class="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs rounded-full font-mono flex items-center gap-1">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
              {{ totalCommentCount }}
            </div>
          </div>
          
          <!-- Actions -->
          <button
            v-if="authStore.isAuthenticated()"
            @click="showRatingForm = true"
            class="px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-xs rounded font-medium transition-all"
          >
            Rate
          </button>
          <router-link
            v-else
            to="/login"
            class="px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 text-gray-400 text-xs rounded font-medium transition-all hover:text-gray-300 hover:border-gray-600/50"
          >
            Login to Rate
          </router-link>
          
          <button
            v-if="canDeleteSubmission"
            @click="handleDeleteSubmission"
            class="px-2 py-1 text-red-400/70 hover:text-red-400 text-xs transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>

      <!-- Description row (expandable) -->
      <div class="px-6 py-2 border-t border-gray-700/30">
        <div v-if="!editingDescription" class="group">
          <div class="flex items-start gap-3">
            <span class="text-xs text-gray-500 uppercase tracking-wider pt-1">Context</span>
            <div 
              v-if="submission?.metadata.description"
              class="flex-1 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors leading-relaxed"
              @click="canEditSubmission && startEditDescription()"
              v-html="renderMarkdown(submission.metadata.description)"
            ></div>
            <button
              v-else-if="canEditSubmission"
              @click="startEditDescription"
              class="flex-1 text-sm text-gray-500 hover:text-gray-400 italic text-left transition-colors"
            >
              + Add context...
            </button>
            <span v-else class="flex-1 text-sm text-gray-600 italic">No context provided</span>
            <button
              v-if="canEditSubmission && submission?.metadata.description"
              @click.stop="startEditDescription"
              class="text-xs text-gray-500 hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✏️
            </button>
          </div>
        </div>
        <div v-else class="flex flex-col gap-2">
          <textarea
            v-model="descriptionEdit"
            ref="descriptionTextarea"
            @keyup.ctrl.enter="saveDescription"
            @keyup.meta.enter="saveDescription"
            @keyup.esc="cancelEditDescription"
            rows="3"
            class="w-full px-3 py-2 text-sm bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded focus:ring-1 focus:ring-indigo-500/50 placeholder-gray-600 resize-y"
            placeholder="Describe the research context: methodology, interesting aspects, what to look for..."
          />
          <div class="flex justify-end gap-2">
            <button @click="cancelEditDescription" class="px-3 py-1 text-xs text-gray-500 hover:text-gray-400 transition-colors">Cancel</button>
            <button @click="saveDescription" class="px-3 py-1 text-xs bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-300 rounded transition-colors">Save</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading overlay for pinned message -->
    <div
      v-if="loadingPinnedMessage"
      class="fixed inset-0 z-40 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm"
      :style="{ paddingTop: contentPaddingTop }"
    >
      <div class="flex flex-col items-center gap-3">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500/30 border-t-indigo-500"></div>
        <div class="text-sm text-gray-400">Loading pinned message...</div>
      </div>
    </div>

    <!-- Main Content (below fixed header - dynamic padding) -->
    <div :style="{ paddingTop: contentPaddingTop }" class="min-h-screen">
      <!-- Two-column layout for desktop, single column for mobile -->
      <div class="flex flex-col lg:flex-row">
        <!-- Conversation (full width mobile, 60% desktop) -->
        <div class="w-full lg:w-[60%] px-6 py-8" ref="conversationContainerEl">
          <MessageList
            v-if="messages.length > 0"
            :messages="messages"
            :annotated-message-ids="annotatedMessageIds"
            :inline-annotations="new Map()"
            :user-names="userNames"
            :current-user-id="authStore.user?.id"
            :can-moderate="canHideMessages"
            :can-view-hidden="canViewHiddenMessages"
            :can-pin="canPin"
            :pinned-message-id="pinnedMessageId"
            :hidden-message-ids="hiddenMessageIds"
            :message-reactions="messageReactions"
            :participant-avatars="participantAvatars"
            @add-tag-to-message="handleAddTagToMessage"
            @add-comment-to-message="handleAddCommentToMessage"
            @copy-message="handleCopyMessage"
            @toggle-pin="handleTogglePin"
            @toggle-hide="handleToggleHide"
            @hide-all-previous="handleHideAllPrevious"
            @toggle-reaction="handleToggleReaction"
            @text-selected="handleTextSelected"
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
            :vertical-bars="verticalBars"
            :conversation-el="conversationContainerEl"
            :user-names="userNames"
            :current-user-id="authStore.user?.id"
            :can-moderate="canHideMessages"
            @add-tag-vote="handleAddTagVote"
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
      :existing-ratings="currentUserRatings"
      :criterion-aggregates="criterionAggregates"
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

    <!-- Tag Popover (inline tag selection) -->
    <TagPopover
      :show="showTagPopover"
      :position="tagPopoverPosition"
      :ontologies="ontologiesForPicker"
      :existing-tag-ids="currentPopoverTagIds"
      @tag-toggled="handleTagToggled"
      @cancel="closeTagPopover"
    />

    <!-- Comment Input (inline comment form) -->
    <CommentInput
      :show="showCommentInput"
      :position="commentInputPosition"
      @submit="submitCommentToMessage"
      @cancel="showCommentInput = false"
    />

    <!-- Text Selection Context Menu -->
    <div
      v-if="showTextSelectionMenu && authStore.isAuthenticated()"
      class="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors"
      :style="{ left: textSelectionMenuPosition.x + 'px', top: textSelectionMenuPosition.y + 'px' }"
      @click.stop
    >
      <button
        @click="handleAddTagToSelection"
        class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        Add Tag
      </button>
      <button
        @click="handleAddCommentToTextSelection"
        class="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        Add Comment
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubmissionsStore } from '@/stores/submissions'
import MessageList from '@/components/MessageList.vue'
import AnnotationMargin from '@/components/AnnotationMargin.vue'
import CommentForm from '@/components/CommentForm.vue'
import TagPicker from '@/components/TagPicker.vue'
import TagPopover from '@/components/TagPopover.vue'
import CommentInput from '@/components/CommentInput.vue'
import TopicSelector from '@/components/TopicSelector.vue'
import RatingForm from '@/components/RatingForm.vue'
import type { Message, Selection, Comment, Rating, Topic } from '@/types'
import type { MarginAnnotation, VerticalBar } from '@/utils/layout-manager'
import { ontologiesAPI, submissionsAPI, annotationsAPI, researchAPI, rankingsAPI, authAPI } from '@/services/api'
import { renderMarkdown } from '@/utils/markdown'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const submissionsStore = useSubmissionsStore()

const submissionId = route.params.id as string
const loading = ref(true)
const loadingPinnedMessage = ref(false)
const isMobile = ref(window.innerWidth < 1024)

const submission = ref()
const messages = ref<Message[]>([])
const selections = ref<Selection[]>([])
const pinnedMessageId = ref<string | null>(null)
const hiddenMessageIds = ref<Set<string>>(new Set())
const messageReactions = ref<Map<string, Array<{ user_id: string; reaction_type: string }>>>(new Map())

// Build participant avatars map from message metadata
const participantAvatars = computed(() => {
  const avatars = new Map<string, string>()
  for (const msg of messages.value) {
    if (msg.metadata?.avatar_url && typeof msg.metadata.avatar_url === 'string') {
      avatars.set(msg.participant_name, msg.metadata.avatar_url as string)
    }
  }
  console.log('[AnnotationWorkspace] Participant avatars map:', Array.from(avatars.entries()))
  return avatars
})
const selectionData = ref<Map<string, {
  comments: Comment[]
  tags: any[]
  tagAttributions: Array<{ tag_id: string; tagged_by: string; tagged_at: Date }>
}>>(new Map())
const submissionRatings = ref<Rating[]>([])
const attachedOntologies = ref<any[]>([])
const allOntologies = ref<Map<string, any>>(new Map())
const allTags = ref<Map<string, any>>(new Map())
const submitterName = ref('User')
const submissionComments = ref<Comment[]>([])
const userNames = ref<Map<string, string>>(new Map())

const editingDescription = ref(false)
const descriptionEdit = ref('')
const descriptionTextarea = ref<HTMLTextAreaElement>()
const editingTitle = ref(false)
const titleEdit = ref('')
const titleInput = ref<HTMLInputElement>()
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

// Permission to hide messages (owner or admin only)
const canHideMessages = computed(() => {
  if (!authStore.user || !submission.value) return false
  return submission.value.submitter_id === authStore.user.id ||
         authStore.user.roles.includes('admin')
})

// Permission to view hidden messages (researchers can see what's hidden, but not hide)
// Owners can also see individual hidden messages so they can manage them
const canViewHiddenMessages = computed(() => {
  if (!authStore.user || !submission.value) return false
  
  // Check if user is researcher, admin, or the submission owner
  const isOwner = submission.value.submitter_id === authStore.user.id
  const isResearcher = authStore.user.roles.includes('researcher')
  const isAdmin = authStore.user.roles.includes('admin')
  
  return isOwner || isResearcher || isAdmin
})

const canPin = computed(() => {
  if (!authStore.user || !submission.value) return false
  return submission.value.submitter_id === authStore.user.id ||
         authStore.user.roles.includes('admin') ||
         authStore.user.roles.includes('researcher')
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
  document.addEventListener('click', handleDocumentClick)
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

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleDocumentClick)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

// Abbreviate ranking system names to first letters
function abbreviate(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
}

async function loadData() {
  loading.value = true
  try {
    // Load submission metadata FIRST (lightweight, fast) to check for pinned message
    submission.value = await submissionsStore.fetchSubmission(submissionId)
    
    // Check for pinned message and show overlay immediately
    pinnedMessageId.value = (submission.value.metadata as any)?.pinned_message_id || null
    if (pinnedMessageId.value) {
      loadingPinnedMessage.value = true
    }
    
    // Now load messages and other data in parallel
    const [messagesData, selectionsData, topicsData] = await Promise.all([
      submissionsStore.fetchMessages(submissionId),
      submissionsStore.fetchSelections(submissionId),
      researchAPI.getTopics()
    ])
    
    messages.value = messagesData
    selections.value = selectionsData
    availableTopics.value = topicsData.data.topics
    
    // Build user names map - collect all user IDs from all sources
    userNames.value.clear()
    const allUserIds = new Set<string>()
    
    // Add current user first
    if (authStore.user) {
      userNames.value.set(authStore.user.id, authStore.user.name)
      allUserIds.add(authStore.user.id)
    }
    
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
    
    // Set submitter name
    if (submission.value.submitter_id) {
      // If it's the current user, use their name
      if (authStore.user && submission.value.submitter_id === authStore.user.id) {
        submitterName.value = authStore.user.name
      } else {
        submitterName.value = userNames.value.get(submission.value.submitter_id) || 'Loading...'
        
        // If not in cache, fetch it
        if (!userNames.value.has(submission.value.submitter_id)) {
          try {
            const response = await authAPI.getUserNames([submission.value.submitter_id])
            Object.entries(response.data.user_names).forEach(([userId, name]) => {
              userNames.value.set(userId, name)
            })
            submitterName.value = userNames.value.get(submission.value.submitter_id) || 'Unknown User'
          } catch (err) {
            console.error('Failed to load submitter name:', err)
            submitterName.value = 'Unknown User'
          }
        }
      }
    }
    
    // Load ontologies and tags (combines topic-derived + explicit)
    const ontoResponse = await ontologiesAPI.getForSubmission(submissionId)
    attachedOntologies.value = ontoResponse.data.ontologies
    
    // Build ontology and tag maps
    allOntologies.value.clear()
    allTags.value.clear()
    for (const onto of attachedOntologies.value) {
      const ontoDetail = await ontologiesAPI.get(onto.ontology_id)
      // Store the actual ontology object, not the API response wrapper
      allOntologies.value.set(onto.ontology_id, ontoDetail.data.ontology)
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
      
      selectionData.value.set(sel.id, { comments, tags, tagAttributions: sel.tag_attributions || [] })
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
    
    // Load hidden messages (for researchers/admins/owners who can see individual badges)
    if (canViewHiddenMessages.value) {
      try {
        const hiddenResponse = await submissionsAPI.getHiddenMessages(submissionId)
        hiddenMessageIds.value = new Set(hiddenResponse.data.hidden_message_ids)
      } catch (err) {
        console.error('Failed to load hidden messages:', err)
      }
    } else {
      // For regular users, detect hidden messages from the _isHidden flag
      const hiddenIds = messages.value
        .filter(msg => (msg as any)._isHidden === true)
        .map(msg => msg.id)
      hiddenMessageIds.value = new Set(hiddenIds)
    }
    
    // Auto-scroll to pinned message FIRST (before loading reactions)
    // This prevents blocking the UI on slow connections
    if (pinnedMessageId.value) {
      nextTick(() => {
        scrollToPinnedMessage()
      })
    }
    
    // Load reactions for all messages in parallel (background, non-blocking)
    // Don't await - let them load after UI is ready
    messageReactions.value.clear()
    Promise.all(
      messages.value.map(msg => 
        submissionsAPI.getReactions(submissionId, msg.id)
          .then(response => {
            if (response.data.reactions.length > 0) {
              messageReactions.value.set(msg.id, response.data.reactions)
            }
          })
          .catch(err => {
            console.error('Failed to load reactions for message:', msg.id, err)
          })
      )
    ).then(() => {
      console.log('[Reactions] All reactions loaded')
    })
    
  } catch (err) {
    console.error('Failed to load submission:', err)
  } finally {
    loading.value = false
    
    // Safety: if we're still showing the pinned message overlay after data loads,
    // clear it (in case the pinned message doesn't exist)
    setTimeout(() => {
      if (loadingPinnedMessage.value) {
        console.warn('[Pinned] Safety timeout: clearing overlay after data load')
        loadingPinnedMessage.value = false
      }
    }, 2000)
  }
}

function handleAddTagToMessage(messageId: string) {
  const messageEl = document.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null
  if (!messageEl) return

  const actionsBar = messageEl.querySelector('[data-message-actions]') as HTMLElement | null
  const fallbackRect = messageEl.getBoundingClientRect()
  let posX = fallbackRect.left
  let posY = fallbackRect.bottom + 6

  if (actionsBar) {
    const rect = actionsBar.getBoundingClientRect()
    posX = rect.left
    posY = rect.bottom + 4
  }

  const viewportWidth = window.innerWidth
  if (posX + TAG_POPOVER_WIDTH + 8 > viewportWidth) {
    posX = viewportWidth - TAG_POPOVER_WIDTH - 8
  }
  if (posX < 8) {
    posX = 8
  }

  tagPopoverPosition.value = { x: posX, y: posY }

  const existingSelection = selections.value.find(
    s =>
      s.start_message_id === messageId &&
      s.end_message_id === messageId &&
      s.start_offset == null &&
      s.end_offset == null
  )

  currentPopoverSelectionId.value = existingSelection?.id || null

  if (existingSelection?.id) {
    const currentUserId = authStore.user?.id
    const existingData = selectionData.value.get(existingSelection.id)
    
    // Only show tags that the current user has voted for
    if (currentUserId) {
      const myTagAttributions = (existingData?.tagAttributions || existingSelection.tag_attributions || [])
        .filter((attr: any) => attr.tagged_by === currentUserId)
      currentPopoverTagIds.value = myTagAttributions.map((attr: any) => attr.tag_id)
    } else {
      currentPopoverTagIds.value = []
    }
  } else {
    currentPopoverTagIds.value = []
  }

  activeMessageId.value = messageId
  showTagPopover.value = true
}

function closeTagPopover() {
  showTagPopover.value = false
  activeMessageId.value = null
  currentPopoverSelectionId.value = null
  currentPopoverTagIds.value = []
}

function handleAddCommentToMessage(messageId: string) {
  // Get message position to anchor input
  const messageEl = document.querySelector(`[data-message-id="${messageId}"]`)
  if (!messageEl) return
  
  const rect = messageEl.getBoundingClientRect()
  commentInputPosition.value = {
    x: rect.right + 10,
    y: rect.top
  }
  
  activeMessageId.value = messageId
  showCommentInput.value = true
}

function handleCopyMessage(messageId: string) {
  const message = messages.value.find(m => m.id === messageId)
  if (!message) return
  
  // Extract text from content blocks
  const text = message.content_blocks
    .filter(block => block.type === 'text')
    .map(block => block.text || '')
    .join('\n')
  
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log('Message copied to clipboard')
      // TODO: Show toast notification
    })
    .catch(err => {
      console.error('Failed to copy message:', err)
    })
}

async function handleTogglePin(messageId: string) {
  try {
    // If this message is already pinned, unpin it
    if (pinnedMessageId.value === messageId) {
      await submissionsAPI.unpinMessage(submissionId)
      pinnedMessageId.value = null
      console.log('Message unpinned')
    } else {
      // Pin this message
      await submissionsAPI.pinMessage(submissionId, messageId)
      pinnedMessageId.value = messageId
      console.log('Message pinned')
    }
    
    // Reload submission to get updated metadata
    submission.value = await submissionsStore.fetchSubmission(submissionId)
  } catch (err) {
    console.error('Failed to toggle pin:', err)
  }
}

async function handleToggleHide(messageId: string) {
  try {
    // If message is hidden, unhide it
    if (hiddenMessageIds.value.has(messageId)) {
      await submissionsAPI.unhideMessage(submissionId, messageId)
      hiddenMessageIds.value.delete(messageId)
    } else {
      // Hide this message
      await submissionsAPI.hideMessage(submissionId, messageId)
      hiddenMessageIds.value.add(messageId)
    }
  } catch (err) {
    console.error('Failed to toggle hide:', err)
  }
}

async function handleHideAllPrevious(messageId: string) {
  try {
    const response = await submissionsAPI.hideAllPrevious(submissionId, messageId)
    
    // Add all newly hidden message IDs to the set
    for (const hiddenId of response.data.message_ids) {
      hiddenMessageIds.value.add(hiddenId)
    }
  } catch (err) {
    console.error('Failed to hide all previous:', err)
  }
}

function scrollToPinnedMessage() {
  if (!pinnedMessageId.value) {
    console.log('[Pinned] No pinned message ID')
    loadingPinnedMessage.value = false
    return
  }
  
  console.log('[Pinned] Looking for message:', pinnedMessageId.value)
  console.log('[Pinned] Total messages loaded:', messages.value.length)
  console.log('[Pinned] Message IDs:', messages.value.map(m => m.id))
  
  // Check if pinned message is in the loaded messages
  const pinnedMsg = messages.value.find(m => m.id === pinnedMessageId.value)
  if (!pinnedMsg) {
    console.error('[Pinned] Pinned message ID not found in loaded messages!')
    loadingPinnedMessage.value = false
    return
  }
  
  console.log('[Pinned] Found in messages array, now waiting for DOM element')
  
  // Wait for the pinned message element to exist in DOM (with timeout)
  // Longer timeout for slow connections and mobile
  const maxAttempts = 100 // 10 seconds max (100 * 100ms)
  let attempts = 0
  
  const checkAndScroll = () => {
    const messageEl = document.querySelector(`[data-message-id="${pinnedMessageId.value}"]`) as HTMLElement
    
    console.log(`[Pinned] Attempt ${attempts + 1}/${maxAttempts} - Element found:`, !!messageEl)
    
    if (messageEl) {
      console.log('[Pinned] Element found! Clearing overlay and scrolling')
      // Clear loading overlay immediately - we found the element!
      loadingPinnedMessage.value = false
      
      // Calculate position accounting for fixed header
      const messageRect = messageEl.getBoundingClientRect()
      const scrollOffset = window.scrollY + messageRect.top - headerHeight.value - 20 // 20px extra padding
      
      // Smooth scroll to calculated position
      window.scrollTo({
        top: scrollOffset,
        behavior: 'smooth'
      })
      
      // Briefly highlight the pinned message
      messageEl.classList.add('ring-2', 'ring-amber-400')
      setTimeout(() => {
        messageEl.classList.remove('ring-2', 'ring-amber-400')
      }, 2000)
    } else if (attempts < maxAttempts) {
      // Element not ready yet, try again
      attempts++
      setTimeout(checkAndScroll, 100)
    } else {
      // Timeout - element never appeared
      console.error('[Pinned] TIMEOUT! Element never appeared in DOM after', maxAttempts, 'attempts')
      console.error('[Pinned] All message elements:', document.querySelectorAll('[data-message-id]').length)
      loadingPinnedMessage.value = false
    }
  }
  
  checkAndScroll()
}

async function handleToggleReaction(messageId: string, reactionType: 'star' | 'laugh' | 'sparkles') {
  try {
    const currentUserId = authStore.user?.id
    if (!currentUserId) return
    
    const reactions = messageReactions.value.get(messageId) || []
    const hasReacted = reactions.some(r => r.user_id === currentUserId && r.reaction_type === reactionType)
    
    if (hasReacted) {
      // Remove reaction
      await submissionsAPI.removeReaction(submissionId, messageId, reactionType)
    } else {
      // Add reaction
      await submissionsAPI.addReaction(submissionId, messageId, reactionType)
    }
    
    // Reload reactions for this message
    const reactionResponse = await submissionsAPI.getReactions(submissionId, messageId)
    if (reactionResponse.data.reactions.length > 0) {
      messageReactions.value.set(messageId, reactionResponse.data.reactions)
    } else {
      messageReactions.value.delete(messageId)
    }
  } catch (err) {
    console.error('Failed to toggle reaction:', err)
  }
}

function handleTextSelected(messageId: string, text: string, start: number, end: number) {
  // Store the selection data
  pendingTextSelection.value = { messageId, text, start, end }
  
  // Get cursor position from current selection
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  
  // Position menu near the end of selection
  textSelectionMenuPosition.value = {
    x: rect.right + 10,
    y: rect.top
  }
  
  showTextSelectionMenu.value = true
}

async function handleAddTagToSelection() {
  if (!pendingTextSelection.value) return
  
  // Create a selection for the text
  try {
    const selection = await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: pendingTextSelection.value.messageId,
      end_message_id: pendingTextSelection.value.messageId,
      start_offset: pendingTextSelection.value.start,
      end_offset: pendingTextSelection.value.end,
      label: pendingTextSelection.value.text.substring(0, 50),
      annotation_tags: []
    })
    
    selections.value.push(selection)
    selectionData.value.set(selection.id, { comments: [], tags: [], tagAttributions: [] })
    
    // Open tag picker for this new selection
    activeSelectionId.value = selection.id
    showTextSelectionMenu.value = false
    showTagPicker.value = true
    
    pendingTextSelection.value = null
  } catch (err) {
    console.error('Failed to create selection:', err)
  }
}

async function handleAddCommentToTextSelection() {
  if (!pendingTextSelection.value) return
  
  // Create a selection for the text
  try {
    const selection = await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: pendingTextSelection.value.messageId,
      end_message_id: pendingTextSelection.value.messageId,
      start_offset: pendingTextSelection.value.start,
      end_offset: pendingTextSelection.value.end,
      label: pendingTextSelection.value.text.substring(0, 50),
      annotation_tags: []
    })
    
    selections.value.push(selection)
    selectionData.value.set(selection.id, { comments: [], tags: [], tagAttributions: [] })
    
    // Open comment form for this new selection
    activeSelectionId.value = selection.id
    commentContext.value = {
      messageId: pendingTextSelection.value.messageId,
      text: pendingTextSelection.value.text,
      selectionId: selection.id
    }
    showTextSelectionMenu.value = false
    showCommentForm.value = true
    
    pendingTextSelection.value = null
  } catch (err) {
    console.error('Failed to create selection:', err)
  }
}

async function handleTagToggled(tagId: string, shouldSelect: boolean) {
  if (!activeMessageId.value) return
  const currentUserId = authStore.user?.id
  let previousTagIdsSnapshot: Set<string> | null = null
  let previousRecordSnapshot: { comments: Comment[]; tags: any[]; tagAttributions: Array<{ tag_id: string; tagged_by: string; tagged_at: Date }> } | null = null
  let targetSelectionId: string | null = null

  try {
    let selection: Selection | undefined

    if (currentPopoverSelectionId.value) {
      selection = selections.value.find(s => s.id === currentPopoverSelectionId.value)
    }

    if (!selection) {
      selection = await submissionsStore.createSelection({
        submission_id: submissionId,
        start_message_id: activeMessageId.value,
        end_message_id: activeMessageId.value,
        start_offset: undefined,
        end_offset: undefined,
        label: undefined,
        annotation_tags: []
      })

      selections.value.push(selection)
      selectionData.value.set(selection.id, { comments: [], tags: [], tagAttributions: [] })
      currentPopoverSelectionId.value = selection.id
    }

    targetSelectionId = selection.id

    previousTagIdsSnapshot = new Set(currentPopoverTagIds.value)
    const selectionRecord = selectionData.value.get(selection.id) || { comments: [], tags: [], tagAttributions: [] }
    previousRecordSnapshot = {
      comments: selectionRecord.comments ? [...selectionRecord.comments] : [],
      tags: selectionRecord.tags ? [...selectionRecord.tags] : [],
      tagAttributions: selectionRecord.tagAttributions ? [...selectionRecord.tagAttributions] : []
    }

    const tagSet = new Set(previousTagIdsSnapshot)

    if (shouldSelect) {
      tagSet.add(tagId)
    } else {
      const hasMyVote = previousRecordSnapshot.tagAttributions.some(a => a.tag_id === tagId && a.tagged_by === currentUserId)
      if (!hasMyVote) {
        console.warn('Cannot remove tag vote you do not own.')
        return
      }
      tagSet.delete(tagId)
    }

    currentPopoverTagIds.value = Array.from(tagSet)

    if (shouldSelect) {
      await ontologiesAPI.applyTags(selection.id, [tagId])
    } else {
      await annotationsAPI.removeTag(selection.id, tagId)
    }

    const response = await annotationsAPI.getSelections(submissionId)
    const updatedSelection = response.data.selections.find(s => s.id === selection!.id)

    let selTags: string[]
    let selAttributions: Array<{ tag_id: string; tagged_by: string; tagged_at: Date }>

    if (updatedSelection) {
      selTags = updatedSelection.annotation_tags || []
      selAttributions = (updatedSelection.tag_attributions || []).map(attr => ({
        tag_id: attr.tag_id,
        tagged_by: attr.tagged_by,
        tagged_at: new Date(attr.tagged_at)
      }))
    } else {
      selTags = Array.from(tagSet)
      const existingAttrs = previousRecordSnapshot.tagAttributions ? [...previousRecordSnapshot.tagAttributions] : []
      if (currentUserId) {
        if (shouldSelect) {
          existingAttrs.push({
            tag_id: tagId,
            tagged_by: currentUserId,
            tagged_at: new Date()
          })
        } else {
          const idx = existingAttrs.findIndex(a => a.tag_id === tagId && a.tagged_by === currentUserId)
          if (idx !== -1) {
            existingAttrs.splice(idx, 1)
          }
        }
      }
      selAttributions = existingAttrs
    }

    // Only show tags that the current user has voted for in the popover
    if (currentUserId) {
      const myTagIds = selAttributions
        .filter(attr => attr.tagged_by === currentUserId)
        .map(attr => attr.tag_id)
      currentPopoverTagIds.value = myTagIds
    } else {
      currentPopoverTagIds.value = []
    }

    const existing = selectionData.value.get(selection!.id) || { comments: [], tags: [], tagAttributions: [] }
    const tagObjs = selTags
      .map((id: string) => allTags.value.get(id))
      .filter((t: any) => t)

    selectionData.value.set(selection!.id, {
      comments: existing.comments || [],
      tags: tagObjs,
      tagAttributions: selAttributions
    })

    const selectionIndex = selections.value.findIndex(s => s.id === selection!.id)
    if (selectionIndex !== -1) {
      selections.value[selectionIndex] = {
        ...selections.value[selectionIndex],
        annotation_tags: selTags,
        tag_attributions: selAttributions
      }
    }
  } catch (err) {
    console.error('Failed to toggle tag:', err)
    if (targetSelectionId) {
      if (previousTagIdsSnapshot) {
        currentPopoverTagIds.value = Array.from(previousTagIdsSnapshot)
      }
      if (previousRecordSnapshot) {
        selectionData.value.set(targetSelectionId, {
          comments: previousRecordSnapshot.comments,
          tags: previousRecordSnapshot.tags,
          tagAttributions: previousRecordSnapshot.tagAttributions
        })
      }
    }
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as HTMLElement

  if (
    showTagPopover.value &&
    !target.closest('.tag-popover') &&
    !target.closest('[data-message-actions]')
  ) {
    closeTagPopover()
  }
}

async function submitCommentToMessage(text: string) {
  if (!activeMessageId.value) return
  
  // Create a selection for the message
  try {
    const selection = await submissionsStore.createSelection({
      submission_id: submissionId,
      start_message_id: activeMessageId.value,
      end_message_id: activeMessageId.value,
      start_offset: undefined,
      end_offset: undefined,
      label: undefined,
      annotation_tags: []
    })
    
    selections.value.push(selection)
    selectionData.value.set(selection.id, { comments: [], tags: [], tagAttributions: [] })
    
    // Add comment to the selection
    const commentResponse = await annotationsAPI.createComment({
      selection_id: selection.id,
      content: text
    })
    const comment = commentResponse.data
    const data = selectionData.value.get(selection.id)
    if (data) {
      data.comments.push(comment)
    }
    
    showCommentInput.value = false
    activeMessageId.value = null
  } catch (err) {
    console.error('Failed to submit comment:', err)
  }
}

const showCommentForm = ref(false)
const showTagPicker = ref(false)
const showRatingForm = ref(false)
const showStatsDetail = ref(false)
const activeSelectionId = ref<string | null>(null)
const commentContext = ref<{ messageId: string; text?: string; selectionId?: string } | null>(null)
const conversationContainerEl = ref<HTMLElement | null>(null)
const showSelectionToolbar = ref(false)

// New inline popover state
const showTagPopover = ref(false)
const tagPopoverPosition = ref({ x: 0, y: 0 })
const activeMessageId = ref<string | null>(null)
const currentPopoverSelectionId = ref<string | null>(null)
const currentPopoverTagIds = ref<string[]>([])
const showCommentInput = ref(false)
const commentInputPosition = ref({ x: 0, y: 0 })
const showTextSelectionMenu = ref(false)
const textSelectionMenuPosition = ref({ x: 0, y: 0 })
const pendingTextSelection = ref<{ messageId: string; text: string; start: number; end: number } | null>(null)
const headerEl = ref<HTMLElement | null>(null)
const headerHeight = ref(0)
const attachedRankingSystems = ref<any[]>([])
const TAG_POPOVER_WIDTH = 224
const allCriteria = ref<Map<string, any>>(new Map())

// Computed helpers
const totalCommentCount = computed(() => {
  let count = 0
  for (const data of selectionData.value.values()) {
    count += data.comments.length
  }
  return count
})

// Per-system rating averages
const systemRatingAverages = computed(() => {
  const systemStats = new Map<string, { system_id: string; system_name: string; scores: number[]; max: number }>()
  
  for (const rating of submissionRatings.value) {
    const criterion = allCriteria.value.get(rating.criterion_id)
    if (!criterion) continue
    
    const systemId = criterion.ranking_system_id
    if (!systemStats.has(systemId)) {
      const systemDetail = rankingSystemDetails.value.get(systemId)
      systemStats.set(systemId, {
        system_id: systemId,
        system_name: systemDetail?.data.ranking_system?.name || 'System',
        scores: [],
        max: criterion.scale_max || 5
      })
    }
    systemStats.get(systemId)!.scores.push(rating.score)
  }
  
  return Array.from(systemStats.values()).map(stat => ({
    system_id: stat.system_id,
    system_name: stat.system_name,
    avg: stat.scores.reduce((a, b) => a + b, 0) / stat.scores.length,
    count: stat.scores.length,
    max: stat.max
  }))
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

// Filter ratings to only current user's ratings
const currentUserRatings = computed(() => {
  const currentUserId = authStore.user?.id
  if (!currentUserId) return []
  return submissionRatings.value.filter(r => r.rater_id === currentUserId)
})

// Compute aggregates per criterion for display
const criterionAggregates = computed(() => {
  const aggregates = new Map<string, { avg: number; count: number; max: number }>()
  
  for (const rating of submissionRatings.value) {
    const criterion = allCriteria.value.get(rating.criterion_id)
    if (!criterion) continue
    
    if (!aggregates.has(rating.criterion_id)) {
      aggregates.set(rating.criterion_id, {
        avg: 0,
        count: 0,
        max: criterion.scale_max
      })
    }
    const agg = aggregates.get(rating.criterion_id)!
    agg.avg = ((agg.avg * agg.count) + rating.score) / (agg.count + 1)
    agg.count++
  }
  
  return aggregates
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


// Ontologies for tag picker
const ontologiesForPicker = computed(() => {
  return attachedOntologies.value
    .map(subOnto => {
      const ontologyDetail = allOntologies.value.get(subOnto.ontology_id)
      if (!ontologyDetail) return null
      
      const tags = Array.from(allTags.value.values()).filter(t => t.ontology_id === subOnto.ontology_id)
      
      return {
        ontology: ontologyDetail,
        tags
      }
    })
    .filter((item): item is { ontology: any; tags: any[] } => item !== null)
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

// Build vertical bars - one per selection
const verticalBars = computed<VerticalBar[]>(() => {
  const bars: VerticalBar[] = []
  
  for (const sel of selections.value) {
    const data = selectionData.value.get(sel.id)
    if (!data) continue
    
    // Determine color: use first tag's color, or generate from selection ID
    let color = '#6B7280' // Default gray
    if (data.tags.length > 0 && data.tags[0].color) {
      color = data.tags[0].color
    } else if (data.tags.length > 0) {
      // Generate from tag name
      let hash = 0
      for (let i = 0; i < data.tags[0].name.length; i++) {
        hash = data.tags[0].name.charCodeAt(i) + ((hash << 5) - hash)
      }
      const hue = hash % 360
      color = `hsl(${hue}, 70%, 60%)`
    }
    
    bars.push({
      id: sel.id,
      selectionId: sel.id,
      startMessageId: sel.start_message_id,
      endMessageId: sel.end_message_id,
      color,
      tags: data.tags
    })
  }
  
  return bars
})

// Build margin annotations - separate annotations for tags and comments
const marginAnnotations = computed<MarginAnnotation[]>(() => {
  const annotations: MarginAnnotation[] = []
  
  for (const sel of selections.value) {
    const data = selectionData.value.get(sel.id)
    if (!data) continue
    
    // Group tag attributions by tag_id
    const tagGroups = new Map<string, typeof sel.tag_attributions>()
    if (sel.tag_attributions) {
      for (const attr of sel.tag_attributions) {
        if (!tagGroups.has(attr.tag_id)) {
          tagGroups.set(attr.tag_id, [])
        }
        tagGroups.get(attr.tag_id)!.push(attr)
      }
    }
    
    // Create one annotation per unique tag
    for (const [tagId, attributions] of tagGroups) {
      const tag = allTags.value.get(tagId)
      if (!tag) continue
      
      annotations.push({
        id: `tag-${sel.id}-${tagId}`,
        type: 'tag-label',
        anchorMessageId: sel.start_message_id,
        priority: 5,
        minHeight: 32,
        data: {
          selectionId: sel.id,
          tag,
          tagAttributions: attributions
        }
      })
    }
    
    // Create one annotation per comment
    for (const comment of data.comments) {
      annotations.push({
        id: `comment-${comment.id}`,
        type: 'comment-card',
        anchorMessageId: sel.start_message_id,
        priority: 4,
        minHeight: 80,
        data: {
          selectionId: sel.id,
          selection: sel,
          comment
        }
      })
    }
  }
  
  return annotations
})

// Build inline annotations for mobile (grouped by message)
// Removed inlineAnnotations - now using margin annotations on all screen sizes

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
        label: undefined,
        annotation_tags: []
      })
      
      targetSelectionId = selection.id
      selections.value.push(selection)
      selectionData.value.set(selection.id, { comments: [], tags: [], tagAttributions: [] })
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


function startEditTitle() {
  titleEdit.value = submission.value?.title || ''
  editingTitle.value = true
  setTimeout(() => titleInput.value?.focus(), 10)
}

async function saveTitle() {
  if (!editingTitle.value) return
  
  const newTitle = titleEdit.value.trim()
  if (!newTitle || newTitle === submission.value?.title) {
    cancelEditTitle()
    return
  }
  
  try {
    await submissionsAPI.update(submissionId, { title: newTitle })
    
    if (submission.value) {
      submission.value.title = newTitle
    }
    editingTitle.value = false
  } catch (err) {
    console.error('Failed to save title:', err)
    cancelEditTitle()
  }
}

function cancelEditTitle() {
  editingTitle.value = false
  titleEdit.value = ''
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
        // Ensure current user's name is in the map
        if (authStore.user && !userNames.value.has(authStore.user.id)) {
          userNames.value.set(authStore.user.id, authStore.user.name)
        }
        
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
    
    // Refresh submission ratings (but keep form open for auto-save workflow)
    submissionRatings.value = await submissionsStore.getRatingsBySubmission(submissionId)
  } catch (err) {
    console.error('Failed to submit ratings:', err)
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
    router.push('/browse')
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


