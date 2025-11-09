<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <h3 class="text-lg font-semibold">🏷️ Tag Selection</h3>
        </div>

        <div class="p-4">
          <!-- Show ontologies with tags -->
          <div v-if="ontologiesWithTags.length > 0" class="space-y-4">
            <div
              v-for="onto in ontologiesWithTags"
              :key="onto.ontology.id"
              class="border border-gray-200 dark:border-gray-800 rounded-lg p-3"
            >
              <div class="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                {{ onto.ontology.name }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-3">
                {{ onto.ontology.description }}
              </div>
              
              <div class="space-y-1">
                <label
                  v-for="tag in onto.tags"
                  :key="tag.id"
                  class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="selectedTagIds.has(tag.id)"
                    @change="toggleTag(tag.id)"
                    class="w-4 h-4"
                  />
                  <span
                    class="px-2 py-0.5 rounded text-xs font-medium"
                    :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                  >
                    {{ tag.name }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ tag.description }}</span>
                </label>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No ontologies attached to this submission.
            <button class="block mx-auto mt-2 text-indigo-600 hover:text-indigo-700 text-sm">
              Attach an ontology first
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 flex justify-end gap-2">
          <button
            @click="$emit('cancel')"
            class="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            @click="applyTags"
            :disabled="selectedTagIds.size === 0"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            Apply {{ selectedTagIds.size }} tag(s)
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { AnnotationOntology, AnnotationTag } from '@/types/ontology'

interface Props {
  show: boolean
  ontologiesWithTags: Array<{
    ontology: AnnotationOntology
    tags: AnnotationTag[]
  }>
  existingTagIds: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'apply': [tagIds: string[]]
  'cancel': []
}>()

const selectedTagIds = ref<Set<string>>(new Set())

watch(() => props.show, (show) => {
  if (show) {
    // Initialize with existing tags
    selectedTagIds.value = new Set(props.existingTagIds)
  }
})

function toggleTag(tagId: string) {
  if (selectedTagIds.value.has(tagId)) {
    selectedTagIds.value.delete(tagId)
  } else {
    selectedTagIds.value.add(tagId)
  }
}

function applyTags() {
  emit('apply', Array.from(selectedTagIds.value))
  selectedTagIds.value.clear()
}
</script>

