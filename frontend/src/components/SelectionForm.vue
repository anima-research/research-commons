<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 class="text-lg font-semibold mb-4">🎯 Create Selection</h3>

        <!-- Selection preview -->
        <div class="bg-gray-50 p-3 rounded mb-4">
          <div class="text-sm text-gray-600 mb-1">
            {{ selectionData.message_count }} message(s) selected
          </div>
          <div v-if="selectionData.text" class="text-sm text-gray-800 italic">
            "{{ truncate(selectionData.text, 150) }}"
          </div>
        </div>

        <!-- Label input -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Label (optional)
          </label>
          <input
            v-model="label"
            ref="labelInput"
            type="text"
            placeholder="e.g., Leading question, Clear preference"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <!-- Options -->
        <div class="space-y-2 mb-4">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input v-model="addCommentNow" type="checkbox" class="w-4 h-4" />
            Add comment after creating selection
          </label>
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input v-model="rateNow" type="checkbox" class="w-4 h-4" />
            Rate against criterion after creating
          </label>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            @click="create"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create Selection
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
  selectionData: any
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'create': [data: any]
  'cancel': []
}>()

const label = ref('')
const addCommentNow = ref(false)
const rateNow = ref(false)
const labelInput = ref<HTMLInputElement>()

watch(() => props.show, async (show) => {
  if (show) {
    await nextTick()
    labelInput.value?.focus()
  }
})

function truncate(text: string, length: number) {
  return text && text.length > length ? text.substring(0, length) + '...' : text
}

function create() {
  emit('create', {
    ...props.selectionData,
    label: label.value || undefined,
    addComment: addCommentNow.value,
    rate: rateNow.value
  })
  
  // Reset
  label.value = ''
  addCommentNow.value = false
  rateNow.value = false
}
</script>

