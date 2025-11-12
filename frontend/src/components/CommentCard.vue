<template>
  <div 
    ref="rootEl"
    class="comment-card bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 transition-all"
  >
    <!-- Header -->
    <div class="flex items-center justify-between mb-2">
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
        </svg>
        <span class="text-xs text-gray-400">{{ createdBy }}</span>
      </div>
      
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
    
    <!-- Comment content -->
    <div class="text-sm text-gray-300 leading-relaxed" v-html="renderMarkdown(comment.content)" />
    
    <!-- Timestamp -->
    <div class="text-xs text-gray-500 mt-2">
      {{ formatDate(comment.created_at) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  comment: {
    id: string
    content: string
    author_id: string
    created_at: string
  }
  selection?: any
  createdBy: string
  canDelete?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canDelete: false
})

const emit = defineEmits<{
  'delete': []
  'resize': [height: number]
}>()

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
