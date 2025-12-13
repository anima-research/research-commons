<template>
  <div 
    ref="rootEl"
    class="comment-card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 transition-all"
    :class="nestingClass"
    :style="nestingStyle"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs text-gray-400">{{ createdBy }}</span>
      </div>
      
      <div class="flex items-center gap-2">
        <button
          @click="$emit('reply')"
          class="text-xs text-gray-400 hover:text-blue-400 transition-colors"
          title="Reply"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          v-if="canEdit"
          @click="startEditing"
          class="text-xs text-gray-400 hover:text-indigo-400 transition-colors"
          title="Edit"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          v-if="canDelete"
          @click="$emit('delete')"
          class="text-xs text-red-400/70 hover:text-red-400 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Comment content (view mode) -->
    <div 
      v-if="!isEditing" 
      class="comment-content text-sm text-gray-300 leading-relaxed" 
      v-html="renderMarkdown(comment.content)" 
    />
    
    <!-- Comment content (edit mode) -->
    <div v-else class="space-y-2">
      <textarea
        v-model="editContent"
        ref="editTextarea"
        rows="3"
        class="w-full px-2 py-1.5 bg-gray-900/80 border border-gray-600 rounded text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        @keydown.escape="cancelEditing"
        @keydown.meta.enter="saveEdit"
        @keydown.ctrl.enter="saveEdit"
      />
      <div class="flex justify-end gap-2">
        <button
          @click="cancelEditing"
          class="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="saveEdit"
          :disabled="!editContent.trim()"
          class="px-2 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded transition-colors"
        >
          Save
        </button>
      </div>
    </div>
    
    <!-- Timestamp -->
    <div class="text-xs text-gray-500 mt-2">
      {{ formatDate(comment.created_at) }}
      <span v-if="comment.updated_at && comment.updated_at !== comment.created_at" class="text-gray-600">
        (edited)
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  comment: {
    id: string
    content: string
    author_id: string
    parent_id?: string
    created_at: string
    updated_at?: string
  }
  selection?: any
  createdBy: string
  canDelete?: boolean
  canEdit?: boolean
  isReply?: boolean
  depth?: number
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: false,
  canEdit: false,
  isReply: false,
  depth: 0
})

// Computed nesting styles based on depth
const nestingClass = computed(() => {
  if (props.depth === 0) return ''
  return 'border-l-2 border-l-blue-500/30'
})

const nestingStyle = computed(() => {
  if (props.depth === 0) return {}
  // Cap the visual indent at 3 levels to prevent excessive nesting
  const indent = Math.min(props.depth, 3) * 12
  return { marginLeft: `${indent}px` }
})

const emit = defineEmits<{
  'delete': []
  'reply': []
  'edit': [content: string]
  'resize': [height: number]
}>()

// Edit mode
const isEditing = ref(false)
const editContent = ref('')
const editTextarea = ref<HTMLTextAreaElement>()

function startEditing() {
  editContent.value = props.comment.content
  isEditing.value = true
  nextTick(() => {
    editTextarea.value?.focus()
  })
}

function cancelEditing() {
  isEditing.value = false
  editContent.value = ''
}

function saveEdit() {
  if (editContent.value.trim()) {
    emit('edit', editContent.value.trim())
    isEditing.value = false
  }
}

const rootEl = ref<HTMLElement>()

const reportHeight = () => {
  if (rootEl.value) {
    emit('resize', rootEl.value.offsetHeight)
  }
}

onMounted(() => {
  nextTick(reportHeight)
})

watch(() => props.comment, () => {
  nextTick(reportHeight)
}, { deep: true })

function formatDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString()
}
</script>

<style scoped>
/* Fix code wrapping in comments */
.comment-content :deep(code) {
  @apply bg-gray-900/50 px-1 py-0.5 rounded text-gray-300 text-xs;
  word-break: break-word;
  white-space: pre-wrap;
}

.comment-content :deep(pre) {
  @apply bg-gray-900/50 p-2 rounded text-xs overflow-x-auto;
  max-width: 100%;
}

.comment-content :deep(pre code) {
  @apply p-0 bg-transparent;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-content :deep(p) {
  @apply my-1;
  word-break: break-word;
}
</style>
