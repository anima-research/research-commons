<template>
  <div 
    v-if="show"
    class="absolute z-50 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100">Add Comment</h3>
      <button
        @click="$emit('cancel')"
        class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Comment Input -->
    <div class="p-4">
      <textarea
        v-model="commentText"
        rows="4"
        placeholder="Write your comment..."
        class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-colors"
        autofocus
      />
    </div>

    <!-- Actions -->
    <div class="px-4 pb-4 flex items-center justify-end gap-2">
      <button
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="submit"
        :disabled="!commentText.trim()"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
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

