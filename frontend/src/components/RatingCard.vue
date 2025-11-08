<template>
  <div 
    class="rating-card bg-white rounded-lg shadow-sm border border-yellow-200 p-3 hover:shadow-md transition-shadow"
    ref="cardEl"
  >
    <div class="flex items-start gap-2 mb-2">
      <span class="text-xl flex-shrink-0">⭐</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900">{{ criterionName }}</div>
        <div class="text-xs text-gray-500">{{ userName }} • {{ timeAgo }}</div>
      </div>
      <div class="text-lg font-bold text-indigo-600">
        {{ rating.score }}<span class="text-sm text-gray-500">/5</span>
      </div>
    </div>
    
    <div v-if="linkedComment" class="text-xs text-gray-600 bg-gray-50 rounded p-2 mt-2">
      💬 "{{ truncate(linkedComment, 80) }}"
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Rating } from '@/types'

interface Props {
  rating: Rating
  criterionName?: string
  userName?: string
  linkedComment?: string
}

const props = withDefaults(defineProps<Props>(), {
  criterionName: 'Criterion',
  userName: 'User'
})

const emit = defineEmits<{
  'resize': [height: number]
}>()

const cardEl = ref<HTMLElement>()

const timeAgo = computed(() => {
  const date = new Date(props.rating.created_at)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
})

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text
}

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
.rating-card {
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

