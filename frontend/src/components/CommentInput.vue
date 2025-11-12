<template>
  <div 
    v-if="show"
    class="fixed z-50 w-96 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-700/50"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <!-- Header -->
    <div class="px-3 py-2 border-b border-gray-700/50 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-100">Add Comment</h3>
      <button
        @click="$emit('cancel')"
        class="text-gray-400 hover:text-gray-200 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Comment Input -->
    <div class="p-3">
      <textarea
        v-model="commentText"
        rows="4"
        placeholder="Write your comment..."
        class="w-full px-2 py-2 bg-gray-900/80 border border-gray-700 rounded text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
        autofocus
      />
    </div>

    <!-- Actions -->
    <div class="px-3 pb-3 flex items-center justify-end gap-2">
      <button
        @click="$emit('cancel')"
        class="px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="submit"
        :disabled="!commentText.trim()"
        class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded transition-colors disabled:cursor-not-allowed"
      >
        Add Comment
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  show: boolean
  selectedText?: string
  position?: { x: number; y: number }
}

const props = withDefaults(defineProps<Props>(), {
  selectedText: '',
  position: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<{
  'submit': [text: string]
  'cancel': []
}>()

const commentText = ref(props.selectedText || '')

function submit() {
  if (!commentText.value.trim()) return
  emit('submit', commentText.value.trim())
  commentText.value = ''
}
</script>

