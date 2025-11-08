<template>
  <div 
    class="selection-info bg-yellow-50 rounded-lg shadow-sm border border-yellow-200 p-3"
    ref="cardEl"
  >
    <div class="flex items-start gap-2 mb-2">
      <span class="text-base">🎯</span>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium text-gray-900">
          {{ selection.label || 'Selection' }}
        </div>
        <div class="text-xs text-gray-500">{{ createdBy }}</div>
      </div>
    </div>
    
    <div class="flex gap-3 text-xs text-gray-600">
      <span>💬 {{ commentCount }}</span>
      <span>⭐ {{ ratingCount }}</span>
    </div>
    
    <div class="flex gap-2 mt-2">
      <button 
        @click="$emit('comment')"
        class="text-xs text-indigo-600 hover:text-indigo-700"
      >
        Comment
      </button>
      <button 
        @click="$emit('rate')"
        class="text-xs text-indigo-600 hover:text-indigo-700"
      >
        Rate
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { Selection } from '@/types'

interface Props {
  selection: Selection
  commentCount: number
  ratingCount: number
  createdBy?: string
}

const props = withDefaults(defineProps<Props>(), {
  createdBy: 'User'
})

const emit = defineEmits<{
  'comment': []
  'rate': []
  'resize': [height: number]
}>()

const cardEl = ref<HTMLElement>()

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

