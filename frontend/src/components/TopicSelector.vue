<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">Select Research Topics</h3>
          <p class="text-sm text-gray-600 mt-1">Choose which topics this submission relates to</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="topics.length === 0" class="text-center py-8 text-gray-500">
            No topics available yet.
          </div>

          <div v-else class="space-y-2">
            <label
              v-for="topic in topics"
              :key="topic.id"
              class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              :class="{ 'bg-indigo-50 border-indigo-300': isSelected(topic.id) }"
            >
              <input
                type="checkbox"
                :checked="isSelected(topic.id)"
                @change="toggleTopic(topic.id)"
                class="w-5 h-5 mt-0.5"
              />
              <div class="flex-1">
                <div class="font-medium text-gray-900">{{ topic.name }}</div>
                <div class="text-sm text-gray-600 mt-1">{{ topic.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            {{ selectedTopicIds.size }} topic(s) selected
          </div>
          <div class="flex gap-2">
            <button
              @click="$emit('cancel')"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="apply"
              class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Topic } from '@/types'

interface Props {
  show: boolean
  topics: Topic[]
  selectedTopicNames: string[]  // Topic names (legacy)
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'apply': [topicNames: string[]]
  'cancel': []
}>()

const selectedTopicIds = ref<Set<string>>(new Set())

watch(() => props.show, (show) => {
  if (show) {
    // Initialize from selected topic names
    selectedTopicIds.value = new Set(
      props.topics
        .filter(t => props.selectedTopicNames.includes(t.name))
        .map(t => t.id)
    )
  }
})

function isSelected(topicId: string): boolean {
  return selectedTopicIds.value.has(topicId)
}

function toggleTopic(topicId: string) {
  if (selectedTopicIds.value.has(topicId)) {
    selectedTopicIds.value.delete(topicId)
  } else {
    selectedTopicIds.value.add(topicId)
  }
}

function apply() {
  // Return topic names for backward compatibility
  const names = props.topics
    .filter(t => selectedTopicIds.value.has(t.id))
    .map(t => t.name)
  
  emit('apply', names)
}
</script>

