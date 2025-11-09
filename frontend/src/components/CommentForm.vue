<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 class="text-lg font-semibold mb-4">💬 Add Comment</h3>

        <!-- Context preview -->
        <div v-if="selectedText" class="bg-gray-50 p-3 rounded mb-4 text-sm">
          <div class="text-gray-600 mb-1">Commenting on:</div>
          <div class="text-gray-800 italic">"{{ truncate(selectedText, 150) }}"</div>
        </div>

        <!-- Comment input -->
        <div class="mb-4">
          <textarea
            v-model="commentText"
            ref="textareaRef"
            placeholder="Share your thoughts... (Markdown supported)"
            rows="6"
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
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
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            @click="submit"
            :disabled="!commentText.trim()"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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

