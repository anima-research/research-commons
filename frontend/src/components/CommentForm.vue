<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full p-6 transition-colors">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">💬 Add Comment</h3>

        <!-- Context preview -->
        <div v-if="selectedText" class="bg-gray-50 dark:bg-gray-800 p-3 rounded mb-4 text-sm border border-gray-200 dark:border-gray-700 transition-colors">
          <div class="text-gray-600 dark:text-gray-400 mb-1">Commenting on:</div>
          <div class="text-gray-800 dark:text-gray-200 italic">"{{ truncate(selectedText, 150) }}"</div>
        </div>

        <!-- Comment input -->
        <div class="mb-4">
          <textarea
            v-model="commentText"
            ref="textareaRef"
            placeholder="Share your thoughts... (Markdown supported)"
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-colors"
            @keydown.meta.enter="submit"
            @keydown.ctrl.enter="submit"
          />
          <div class="flex justify-between items-center mt-1">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Markdown supported: **bold**, *italic*, `code`, [links](url)
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ commentText.length }} characters
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="submit"
            :disabled="!commentText.trim()"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Post Comment
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

interface Props {
  show: boolean
  selectedText?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'submit': [text: string]
  'cancel': []
}>()

const commentText = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

watch(() => props.show, async (show) => {
  if (show) {
    await nextTick()
    textareaRef.value?.focus()
  }
})

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text
}

function submit() {
  if (commentText.value.trim()) {
    emit('submit', commentText.value)
    commentText.value = ''
  }
}
</script>

