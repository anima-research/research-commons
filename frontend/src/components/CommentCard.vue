<template>
  <div 
    class="comment-card bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
    ref="cardEl"
  >
    <div class="flex items-start gap-2 mb-2">
      <div 
        class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
        :style="{ backgroundColor: avatarColor }"
      >
        {{ initial }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900">{{ userName }}</div>
        <div class="text-xs text-gray-500">{{ timeAgo }}</div>
      </div>
      <span class="text-base">💬</span>
    </div>
    
    <div class="text-sm text-gray-800 leading-relaxed">
      {{ comment.content }}
    </div>
    
    <div v-if="comment.target_type === 'selection'" class="text-xs text-gray-500 mt-2">
      on selection
    </div>
    
    <div class="flex gap-3 mt-2">
      <button 
        @click="$emit('reply')"
        class="text-xs text-indigo-600 hover:text-indigo-700"
      >
        Reply
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Comment } from '@/types'

interface Props {
  comment: Comment
  userName?: string
}

const props = withDefaults(defineProps<Props>(), {
  userName: 'User'
})

const emit = defineEmits<{
  'reply': []
  'resize': [height: number]
}>()

const cardEl = ref<HTMLElement>()

// Get actual user name from author_id
const actualUserName = computed(() => {
  if (props.userName && props.userName !== 'User') {
    return props.userName
  }
  // Fallback to ID
  return 'User ' + props.comment.author_id.substring(0, 8)
})

const initial = computed(() => 
  actualUserName.value.charAt(0).toUpperCase()
)

const userName = computed(() => actualUserName.value)

const avatarColor = computed(() => {
  // Generate color from user ID
  let hash = 0
  const id = props.comment.author_id
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  return `hsl(${hue}, 60%, 50%)`
})

const timeAgo = computed(() => {
  const date = new Date(props.comment.created_at)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
})

// Measure and emit height changes
watch(() => cardEl.value?.offsetHeight, (height) => {
  if (height) {
    emit('resize', height)
  }
})

onMounted(() => {
  if (cardEl.value) {
    emit('resize', cardEl.value.offsetHeight)
  }
})
</script>

<style scoped>
.comment-card {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

