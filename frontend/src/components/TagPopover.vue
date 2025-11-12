<template>
  <div 
    v-if="show"
    class="absolute z-50 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 transition-colors"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <!-- Search Input -->
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tags..."
        class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        autofocus
      />
    </div>

    <!-- Tag List -->
    <div class="max-h-96 overflow-y-auto">
      <div
        v-for="onto in filteredOntologies"
        :key="onto.ontology.id"
        class="border-b border-gray-100 dark:border-gray-700 last:border-0"
      >
        <!-- Ontology Header -->
        <div class="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-700 dark:text-gray-300 transition-colors">
          {{ onto.ontology.name }}
        </div>

        <!-- Tags -->
        <div class="p-2 space-y-1">
          <button
            v-for="tag in onto.tags"
            :key="tag.id"
            @click="toggleTag(tag.id)"
            class="w-full px-3 py-2 rounded flex items-center justify-between text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{
              'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500': selectedTagIds.has(tag.id)
            }"
          >
            <span class="text-sm text-gray-900 dark:text-gray-100">{{ tag.name }}</span>
            <svg 
              v-if="selectedTagIds.has(tag.id)" 
              class="w-4 h-4 text-indigo-600 dark:text-indigo-400" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <div v-if="onto.tags.length === 0" class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
            No matching tags
          </div>
        </div>
      </div>

      <div v-if="filteredOntologies.length === 0" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        No tags found
      </div>
    </div>

    <!-- Actions -->
    <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/30 rounded-b-lg">
      <button
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        Cancel
      </button>
      <button
        @click="apply"
        :disabled="selectedTagIds.size === 0"
        class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
      >
        Apply {{ selectedTagIds.size > 0 ? `(${selectedTagIds.size})` : '' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Tag {
  id: string
  name: string
  ontology_id: string
}

interface Ontology {
  id: string
  name: string
}

interface OntologyWithTags {
  ontology: Ontology
  tags: Tag[]
}

interface Props {
  show: boolean
  ontologies: OntologyWithTags[]
  existingTagIds?: string[]
  position?: { x: number; y: number }
}

const props = withDefaults(defineProps<Props>(), {
  existingTagIds: () => [],
  position: () => ({ x: 0, y: 0 })
})

const emit = defineEmits<{
  'apply': [tagIds: string[]]
  'cancel': []
}>()

const searchQuery = ref('')
const selectedTagIds = ref<Set<string>>(new Set(props.existingTagIds))

// Filter tags based on search query
const filteredOntologies = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.ontologies
  }

  const query = searchQuery.value.toLowerCase().trim()
  
  return props.ontologies
    .map(onto => ({
      ...onto,
      tags: onto.tags.filter(tag => 
        tag.name.toLowerCase().includes(query)
      )
    }))
    .filter(onto => onto.tags.length > 0)
})

function toggleTag(tagId: string) {
  if (selectedTagIds.value.has(tagId)) {
    selectedTagIds.value.delete(tagId)
  } else {
    selectedTagIds.value.add(tagId)
  }
}

function apply() {
  emit('apply', Array.from(selectedTagIds.value))
}
</script>

