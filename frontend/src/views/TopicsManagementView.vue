<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <!-- Left Sidebar -->
    <LeftSidebar 
      :show="showMobileSidebar"
      @navigate="handleNavigate"
      @close="showMobileSidebar = false"
    />

    <!-- Mobile hamburger -->
    <button
      v-if="isMobile"
      @click="showMobileSidebar = true"
      class="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 lg:hidden"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Main content (with left margin on desktop) -->
    <div class="lg:ml-64">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 py-4 transition-colors">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">🔬 Research Topics</h1>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateTopic = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            + Create Topic
          </button>
        </div>
      </header>

      <!-- Topics list -->
      <div class="p-4 space-y-4">
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading topics...
        </div>

        <div v-else-if="topics.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="mb-4">No research topics yet.</p>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateTopic = true"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create First Topic
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="topic in topics"
            :key="topic.id"
            class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 hover:shadow-md transition-all group"
          >
            <div class="flex items-start justify-between mb-2">
              <h3 
                class="text-lg font-semibold text-gray-900 dark:text-gray-100"
                title="Topics pages in construction"
              >
                {{ topic.name }}
              </h3>
              
              <!-- Actions (show on hover) -->
              <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  v-if="authStore.hasRole('researcher')"
                  @click="startEditTopic(topic)"
                  class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 transition-colors"
                  title="Edit topic"
                >
                  ✏️
                </button>
                <button
                  v-if="authStore.hasRole('researcher')"
                  @click="handleDeleteTopic(topic.id)"
                  class="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 transition-colors"
                  title="Delete topic"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {{ topic.description }}
            </p>
            <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>Created by {{ topic.created_by.substring(0, 8) }}</span>
              <span v-if="topic.default_ontologies.length > 0">
                • {{ topic.default_ontologies.length }} default ontologies
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Topic Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateTopic || editingTopic"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="closeTopicForm"
      >
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 transition-colors">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {{ editingTopic ? 'Edit Research Topic' : 'Create Research Topic' }}
          </h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                v-model="topicForm.name"
                type="text"
                placeholder="e.g., Model Deprecation Attitudes"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                v-model="topicForm.description"
                rows="3"
                placeholder="What is this research topic about?"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Ontologies
                <span class="text-xs text-gray-500 dark:text-gray-400">(available for submissions)</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="ontology in availableOntologies"
                  :key="ontology.id"
                  class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="topicForm.default_ontologies?.includes(ontology.id)"
                    @change="toggleOntology(ontology.id)"
                    class="w-4 h-4"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ ontology.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ ontology.description }}</div>
                  </div>
                </label>
                <div v-if="availableOntologies.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic">
                  No ontologies available. Create some first.
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Ranking Systems
                <span class="text-xs text-gray-500 dark:text-gray-400">(available for submissions)</span>
              </label>
              <div class="space-y-2">
                <label
                  v-for="system in availableRankingSystems"
                  :key="system.id"
                  class="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="topicForm.default_ranking_systems?.includes(system.id)"
                    @change="toggleRankingSystem(system.id)"
                    class="w-4 h-4"
                  />
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ system.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ system.description }}</div>
                  </div>
                </label>
                <div v-if="availableRankingSystems.length === 0" class="text-xs text-gray-500 dark:text-gray-400 italic">
                  No ranking systems available. Create some first.
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button
              @click="closeTopicForm"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="saveTopic"
              :disabled="!topicForm.name || !topicForm.description"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              {{ editingTopic ? 'Save Changes' : 'Create Topic' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { researchAPI, ontologiesAPI, rankingsAPI } from '@/services/api'
import type { Topic } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const topics = ref<Topic[]>([])
const availableOntologies = ref<any[]>([])
const availableRankingSystems = ref<any[]>([])
const loading = ref(false)
const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)

const showCreateTopic = ref(false)
const editingTopic = ref<Topic | null>(null)
const topicForm = ref<{
  name: string
  description: string
  default_ontologies?: string[]
  default_ranking_systems?: string[]
}>({
  name: '',
  description: '',
  default_ontologies: [],
  default_ranking_systems: []
})

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await Promise.all([
    loadTopics(),
    loadOntologies(),
    loadRankingSystems()
  ])
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadTopics() {
  loading.value = true
  try {
    const response = await researchAPI.getTopics()
    topics.value = response.data.topics
  } catch (err) {
    console.error('Failed to load topics:', err)
  } finally {
    loading.value = false
  }
}

async function loadOntologies() {
  try {
    const response = await ontologiesAPI.list()
    availableOntologies.value = response.data.ontologies
  } catch (err) {
    console.error('Failed to load ontologies:', err)
  }
}

async function loadRankingSystems() {
  try {
    const response = await rankingsAPI.list()
    availableRankingSystems.value = response.data.ranking_systems
  } catch (err) {
    console.error('Failed to load ranking systems:', err)
  }
}

function startEditTopic(topic: Topic) {
  editingTopic.value = topic
  topicForm.value = {
    name: topic.name,
    description: topic.description,
    default_ontologies: topic.default_ontologies,
    default_ranking_systems: topic.default_ranking_systems
  }
}

function closeTopicForm() {
  showCreateTopic.value = false
  editingTopic.value = null
  topicForm.value = { 
    name: '', 
    description: '',
    default_ontologies: [],
    default_ranking_systems: []
  }
}

async function saveTopic() {
  try {
    if (editingTopic.value) {
      // Update existing
      await researchAPI.updateTopic(editingTopic.value.id, topicForm.value)
    } else {
      // Create new
      await researchAPI.createTopic(topicForm.value)
    }
    
    await loadTopics()
    closeTopicForm()
  } catch (err) {
    console.error('Failed to save topic:', err)
  }
}

function toggleOntology(ontologyId: string) {
  if (!topicForm.value.default_ontologies) {
    topicForm.value.default_ontologies = []
  }
  const index = topicForm.value.default_ontologies.indexOf(ontologyId)
  if (index > -1) {
    topicForm.value.default_ontologies.splice(index, 1)
  } else {
    topicForm.value.default_ontologies.push(ontologyId)
  }
}

function toggleRankingSystem(systemId: string) {
  if (!topicForm.value.default_ranking_systems) {
    topicForm.value.default_ranking_systems = []
  }
  const index = topicForm.value.default_ranking_systems.indexOf(systemId)
  if (index > -1) {
    topicForm.value.default_ranking_systems.splice(index, 1)
  } else {
    topicForm.value.default_ranking_systems.push(systemId)
  }
}

async function handleDeleteTopic(topicId: string) {
  const topic = topics.value.find(t => t.id === topicId)
  if (!confirm(`Delete topic "${topic?.name}"?\n\nThis will not delete submissions tagged with this topic.`)) {
    return
  }
  
  try {
    await researchAPI.deleteTopic(topicId)
    await loadTopics()
  } catch (err) {
    console.error('Failed to delete topic:', err)
  }
}
</script>

