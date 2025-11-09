<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />
    
    <div class="lg:ml-64">
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 transition-colors">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">🏷️ Ontologies</h1>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateOntology = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            + Create Ontology
          </button>
        </div>
      </header>

      <div class="p-4 space-y-4">
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading ontologies...
        </div>

        <div v-else-if="ontologies.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="mb-4">No ontologies yet.</p>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateOntology = true"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create First Ontology
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="ontology in ontologies"
            :key="ontology.id"
            class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 transition-colors"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ ontology.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ ontology.description }}</p>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Category: {{ ontology.category }} • {{ ontology.permissions }}
                </div>
              </div>
              <button
                v-if="canEdit(ontology)"
                @click.stop="startEditOntology(ontology)"
                class="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
              >
                ✏️ Edit
              </button>
            </div>

            <!-- Tags list -->
            <div v-if="ontologyTags[ontology.id]" class="mt-4">
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags:</div>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="tag in ontologyTags[ontology.id]"
                  :key="tag.id"
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                  :style="{ backgroundColor: tag.color + '20', color: tag.color }"
                >
                  <span class="font-medium">{{ tag.name }}</span>
                  <span class="text-xs opacity-75">{{ tag.description }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Ontology Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateOntology || showEditOntology"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="showEditOntology ? closeEditForm() : (showCreateOntology = false)"
      >
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 transition-colors">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ showEditOntology ? 'Edit' : 'Create' }} Ontology</h3>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                v-model="ontologyForm.name"
                type="text"
                placeholder="e.g., LLM Response Patterns"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                v-model="ontologyForm.description"
                rows="2"
                placeholder="What does this ontology categorize?"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                v-model="ontologyForm.category"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="response-patterns">Response Patterns</option>
                <option value="interview-quality">Interview Quality</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <!-- Tags -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
              <button
                @click="addTag"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                + Add Tag
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(tag, idx) in ontologyForm.tags"
                :key="idx"
                class="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div class="flex gap-2 mb-2">
                  <input
                    v-model="tag.name"
                    type="text"
                    placeholder="Tag name"
                    class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  />
                  <input
                    v-model="tag.color"
                    type="color"
                    class="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-900"
                  />
                  <button
                    @click="ontologyForm.tags.splice(idx, 1)"
                    class="px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <input
                  v-model="tag.description"
                  type="text"
                  placeholder="Description"
                  class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="showEditOntology ? closeEditForm() : closeCreateForm()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="showEditOntology"
              @click="updateOntology"
              :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Update Ontology
            </button>
            <button
              v-else
              @click="createOntology"
              :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Create Ontology
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ontologiesAPI } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const ontologies = ref<any[]>([])
const ontologyTags = ref<Record<string, any[]>>({})
const loading = ref(false)
const showMobileSidebar = ref(false)
const showCreateOntology = ref(false)
const showEditOntology = ref(false)
const editingOntologyId = ref<string | null>(null)

const ontologyForm = ref({
  name: '',
  description: '',
  category: 'response-patterns' as const,
  permissions: 'public' as const,
  tags: [] as Array<{
    name: string
    description: string
    color: string
    examples?: string[]
  }>
})

const canCreate = computed(() => {
  return ontologyForm.value.name && 
         ontologyForm.value.description && 
         ontologyForm.value.tags.length > 0 &&
         ontologyForm.value.tags.every(t => t.name && t.description)
})

onMounted(async () => {
  await loadOntologies()
})

function handleNavigate(route: string) {
  router.push(route)
}

async function loadOntologies() {
  loading.value = true
  try {
    const response = await ontologiesAPI.list()
    ontologies.value = response.data.ontologies

    // Load tags for each ontology
    for (const ontology of ontologies.value) {
      const detail = await ontologiesAPI.get(ontology.id)
      ontologyTags.value[ontology.id] = detail.data.tags
    }
  } catch (err) {
    console.error('Failed to load ontologies:', err)
  } finally {
    loading.value = false
  }
}

function addTag() {
  ontologyForm.value.tags.push({
    name: '',
    description: '',
    color: '#3b82f6'
  })
}

function closeCreateForm() {
  showCreateOntology.value = false
  ontologyForm.value = {
    name: '',
    description: '',
    category: 'response-patterns',
    permissions: 'public',
    tags: []
  }
}

async function createOntology() {
  try {
    await ontologiesAPI.create(ontologyForm.value)
    await loadOntologies()
    closeCreateForm()
  } catch (err) {
    console.error('Failed to create ontology:', err)
  }
}

function canEdit(ontology: any): boolean {
  if (!authStore.isAuthenticated()) return false
  if (authStore.hasRole('admin')) return true
  return ontology.created_by === authStore.user?.id
}

function startEditOntology(ontology: any) {
  editingOntologyId.value = ontology.id
  ontologyForm.value = {
    name: ontology.name,
    description: ontology.description,
    category: ontology.category,
    permissions: ontology.permissions,
    tags: ontologyTags.value[ontology.id]?.map(t => ({
      name: t.name,
      description: t.description,
      color: t.color,
      examples: t.examples
    })) || []
  }
  showEditOntology.value = true
}

function closeEditForm() {
  showEditOntology.value = false
  editingOntologyId.value = null
  ontologyForm.value = {
    name: '',
    description: '',
    category: 'response-patterns',
    permissions: 'public',
    tags: []
  }
}

async function updateOntology() {
  if (!editingOntologyId.value) return
  
  try {
    await ontologiesAPI.update(editingOntologyId.value, ontologyForm.value)
    await loadOntologies()
    closeEditForm()
  } catch (err) {
    console.error('Failed to update ontology:', err)
  }
}
</script>
