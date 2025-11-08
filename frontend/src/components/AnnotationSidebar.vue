<template>
  <div class="annotation-sidebar w-96 border-l border-gray-200 bg-white p-4 overflow-y-auto">
    <!-- Active Selection Form -->
    <div v-if="showSelectionForm" class="mb-6">
      <h3 class="text-lg font-semibold mb-3">🎯 New Selection</h3>
      
      <div class="bg-gray-50 p-3 rounded mb-3 text-sm">
        <div class="text-gray-600 mb-1">
          {{ selectionData.message_count }} message(s) selected
        </div>
        <div class="text-gray-800 italic">
          "{{ truncate(selectionData.text, 100) }}..."
        </div>
      </div>

      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          Label (optional)
        </label>
        <input
          v-model="selectionLabel"
          type="text"
          placeholder="e.g., Leading question"
          class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div class="space-y-2 mb-4">
        <label class="flex items-center gap-2 text-sm">
          <input v-model="addCommentNow" type="checkbox" class="w-4 h-4" />
          Add comment now
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input v-model="rateNow" type="checkbox" class="w-4 h-4" />
          Rate against criterion
        </label>
      </div>

      <div class="flex gap-2">
        <button
          @click="cancelSelection"
          class="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          @click="createSelection"
          class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create
        </button>
      </div>
    </div>

    <!-- Existing Selections List -->
    <div v-else>
      <h3 class="text-lg font-semibold mb-3">🎯 Selections ({{ selections.length }})</h3>
      
      <div v-if="selections.length === 0" class="text-gray-500 text-sm">
        No selections yet. Select text in a message to get started.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="selection in selections"
          :key="selection.id"
          class="p-3 border border-gray-200 rounded hover:border-indigo-300 cursor-pointer"
          @click="$emit('focus-selection', selection.id)"
        >
          <div v-if="selection.label" class="font-medium text-sm mb-1">
            {{ selection.label }}
          </div>
          <div class="text-xs text-gray-600 mb-2">
            Messages {{ getMessageIndex(selection.start_message_id) }}-{{ getMessageIndex(selection.end_message_id) }}
          </div>
          <div class="flex gap-3 text-xs text-gray-500">
            <span>💬 {{ getCommentCount(selection.id) }}</span>
            <span>⭐ {{ getRatingCount(selection.id) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Comments Section -->
    <div class="mt-6">
      <h3 class="text-lg font-semibold mb-3">💬 Recent Comments</h3>
      
      <div v-if="recentComments.length === 0" class="text-sm text-gray-500">
        No comments yet.
      </div>
      
      <div v-else class="space-y-3">
        <div
          v-for="comment in recentComments"
          :key="comment.id"
          class="text-sm border border-gray-200 rounded p-3 hover:border-indigo-200 cursor-pointer"
          @click="$emit('focus-comment', comment.id)"
        >
          <div class="font-medium text-gray-700 mb-1">
            {{ getUserName(comment.author_id) }}
          </div>
          <div class="text-gray-600 text-xs mb-2">
            {{ truncate(comment.content, 100) }}
          </div>
          <div class="text-xs text-gray-400">
            on {{ comment.target_type }} • {{ formatTime(comment.created_at) }}
          </div>
        </div>
      </div>
      
      <button 
        v-if="comments.length > 3"
        @click="$emit('view-all-comments')"
        class="text-sm text-indigo-600 hover:text-indigo-700 mt-2 w-full text-center"
      >
        View all {{ comments.length }} comments →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Selection, Comment, Rating, Message } from '@/types'

interface Props {
  selections: Selection[]
  comments: Comment[]
  ratings: Rating[]
  messages: Message[]
  showSelectionForm?: boolean
  selectionData?: any
}

const props = withDefaults(defineProps<Props>(), {
  showSelectionForm: false,
  selectionData: () => ({})
})

const emit = defineEmits<{
  'create-selection': [data: any]
  'cancel-selection': []
  'focus-selection': [id: string]
  'focus-comment': [id: string]
  'view-all-comments': []
}>()

const selectionLabel = ref('')
const addCommentNow = ref(false)
const rateNow = ref(false)

// Show only recent 3 comments in sidebar
const recentComments = computed(() => {
  return props.comments.slice(-3).reverse()
})

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) : text
}

function createSelection() {
  emit('create-selection', {
    ...props.selectionData,
    label: selectionLabel.value || undefined,
    addComment: addCommentNow.value,
    rate: rateNow.value
  })
  
  // Reset form
  selectionLabel.value = ''
  addCommentNow.value = false
  rateNow.value = false
}

function cancelSelection() {
  emit('cancel-selection')
  selectionLabel.value = ''
  addCommentNow.value = false
  rateNow.value = false
}

function getMessageIndex(messageId: string) {
  const idx = props.messages.findIndex(m => m.id === messageId)
  return idx !== -1 ? idx + 1 : '?'
}

function getCommentCount(selectionId: string) {
  return props.comments.filter(c => c.target_id === selectionId).length
}

function getRatingCount(selectionId: string) {
  return props.ratings.filter(r => r.target_id === selectionId).length
}

function getUserName(userId: string) {
  // Simplified - just show truncated ID for now
  return 'User ' + userId.substring(0, 8)
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}
</script>

<style scoped>
.annotation-sidebar {
  height: calc(100vh - 128px); /* Account for header */
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
}
</style>

