<template>
  <div
    v-if="show"
    class="fixed z-50 w-56 bg-gray-800/95 backdrop-blur-xl rounded-lg shadow-2xl border border-gray-700/50"
    :style="{ left: `${position.x}px`, top: `${position.y}px` }"
    @click.stop
  >
    <!-- Search Input -->
    <div class="flex items-center justify-between px-2 py-1.5 border-b border-gray-700/50">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search tags..."
        class="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-[11px] text-gray-100 placeholder-gray-500"
        autofocus
      />
      <button
        class="ml-2 text-gray-400 hover:text-gray-200 transition-colors"
        aria-label="Close tag picker"
        @click="$emit('cancel')"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Tag List -->
    <div class="max-h-64 overflow-y-auto py-1">
      <div
        v-for="onto in filteredOntologies"
        :key="onto.ontology.id"
        class="border-b border-gray-700/70 last:border-0"
      >
        <!-- Ontology Header -->
        <div class="px-2 py-1 bg-gray-900/40 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          {{ onto.ontology.name }}
        </div>

        <!-- Tags -->
        <div class="px-1.5 py-1 flex flex-col gap-1">
          <button
            v-for="tag in onto.tags"
            :key="tag.id"
            @click="toggleTag(tag.id)"
            class="w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left hover:bg-gray-700 transition-colors"
            :class="{
              'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-400 dark:ring-indigo-500 text-indigo-700 dark:text-indigo-200': selectedTagIds.has(tag.id),
              'text-gray-800 dark:text-gray-100': !selectedTagIds.has(tag.id)
            }"
          >
            <span class="text-[11px] font-medium">{{ tag.name }}</span>
            <svg 
              v-if="selectedTagIds.has(tag.id)" 
              class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-300" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          <div v-if="onto.tags.length === 0" class="px-2.5 py-1 text-[11px] text-gray-500 dark:text-gray-400 italic">
            No matching tags
          </div>
        </div>
      </div>

      <div v-if="filteredOntologies.length === 0" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-xs">
        No tags found
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

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
  'tag-toggled': [tagId: string, isSelected: boolean]
  'cancel': []
}>()

const searchQuery = ref('')
const selectedTagIds = ref<Set<string>>(new Set(props.existingTagIds))
const syncing = ref(false)

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
  const isSelected = selectedTagIds.value.has(tagId)
  
  // Create a new Set to trigger reactivity
  const newSet = new Set(selectedTagIds.value)
  if (isSelected) {
    newSet.delete(tagId)
  } else {
    newSet.add(tagId)
  }
  selectedTagIds.value = newSet
  
  syncing.value = true
  emit('tag-toggled', tagId, !isSelected)
}

watch(
  () => props.existingTagIds,
  (ids) => {
    const incoming = new Set(ids)
    const differs =
      incoming.size !== selectedTagIds.value.size ||
      ids.some(id => !selectedTagIds.value.has(id))

    if (!syncing.value || differs) {
      selectedTagIds.value = incoming
    }
    if (syncing.value) {
      syncing.value = false
    }
  }
)

watch(
  () => props.show,
  (visible) => {
    if (visible) {
      searchQuery.value = ''
      selectedTagIds.value = new Set(props.existingTagIds)
    }
  }
)
</script>
