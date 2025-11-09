<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />
    
    <div class="lg:ml-64">
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 transition-colors">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">⭐ Ranking Systems</h1>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateSystem = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            + Create Ranking System
          </button>
        </div>
      </header>

      <div class="p-4 space-y-4">
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading ranking systems...
        </div>

        <div v-else-if="rankingSystems.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
          <p class="mb-4">No ranking systems yet.</p>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateSystem = true"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create First Ranking System
          </button>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="system in rankingSystems"
            :key="system.id"
            class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-6 transition-colors"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ system.name }}</h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ system.description }}</p>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Category: {{ system.category }} • {{ system.permissions }}
                </div>
              </div>
              <button
                v-if="canEdit(system)"
                @click.stop="startEditSystem(system)"
                class="px-3 py-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
              >
                ✏️ Edit
              </button>
            </div>

            <!-- Criteria list -->
            <div v-if="systemCriteria[system.id]" class="mt-4 space-y-2">
              <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Criteria:</div>
              <div
                v-for="criterion in systemCriteria[system.id]"
                :key="criterion.id"
                class="text-sm bg-gray-50 dark:bg-gray-800 rounded p-2 border border-gray-200 dark:border-gray-700 transition-colors"
              >
                <div class="font-medium text-gray-900 dark:text-gray-100">{{ criterion.name }}</div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  {{ criterion.description }}
                  <span class="ml-2 text-gray-500 dark:text-gray-400">
                    ({{ criterion.scale_min }}-{{ criterion.scale_max }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Ranking System Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateSystem || showEditSystem"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="showEditSystem ? closeEditForm() : (showCreateSystem = false)"
      >
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6 transition-colors">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{{ showEditSystem ? 'Edit' : 'Create' }} Ranking System</h3>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input
                v-model="systemForm.name"
                type="text"
                placeholder="e.g., Interview Quality Assessment"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                v-model="systemForm.description"
                rows="2"
                placeholder="What does this ranking system evaluate?"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                v-model="systemForm.category"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                <option value="interviewer-quality">Interviewer Quality</option>
                <option value="model-behavior">Model Behavior</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <!-- Criteria -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-3">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Criteria</label>
              <button
                @click="addCriterion"
                class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                + Add Criterion
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(criterion, idx) in systemForm.criteria"
                :key="idx"
                class="border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div class="flex gap-2 mb-2">
                  <input
                    v-model="criterion.name"
                    type="text"
                    placeholder="Criterion name"
                    class="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  />
                  <button
                    @click="systemForm.criteria.splice(idx, 1)"
                    class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <input
                  v-model="criterion.description"
                  type="text"
                  placeholder="Description"
                  class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 mb-2 transition-colors"
                />
                <div class="flex gap-2">
                  <input
                    v-model.number="criterion.scale_min"
                    type="number"
                    placeholder="Min"
                    class="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  />
                  <input
                    v-model.number="criterion.scale_max"
                    type="number"
                    placeholder="Max"
                    class="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="showEditSystem ? closeEditForm() : closeCreateForm()"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="showEditSystem"
              @click="updateSystem"
              :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Update System
            </button>
            <button
              v-else
              @click="createSystem"
              :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Create System
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
import { rankingsAPI } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const rankingSystems = ref<any[]>([])
const systemCriteria = ref<Record<string, any[]>>({})
const loading = ref(false)
const showMobileSidebar = ref(false)
const showCreateSystem = ref(false)
const showEditSystem = ref(false)
const editingSystemId = ref<string | null>(null)

const systemForm = ref({
  name: '',
  description: '',
  category: 'model-behavior' as const,
  permissions: 'public' as const,
  criteria: [] as Array<{
    name: string
    description: string
    scale_type: 'numeric'
    scale_min: number
    scale_max: number
  }>
})

const canCreate = computed(() => {
  return systemForm.value.name && 
         systemForm.value.description && 
         systemForm.value.criteria.length > 0 &&
         systemForm.value.criteria.every(c => c.name && c.description)
})

onMounted(async () => {
  await loadRankingSystems()
})

function handleNavigate(route: string) {
  router.push(route)
}

async function loadRankingSystems() {
  loading.value = true
  try {
    const response = await rankingsAPI.list()
    rankingSystems.value = response.data.ranking_systems

    // Load criteria for each system
    for (const system of rankingSystems.value) {
      const detail = await rankingsAPI.get(system.id)
      systemCriteria.value[system.id] = detail.data.criteria
    }
  } catch (err) {
    console.error('Failed to load ranking systems:', err)
  } finally {
    loading.value = false
  }
}

function addCriterion() {
  systemForm.value.criteria.push({
    name: '',
    description: '',
    scale_type: 'numeric',
    scale_min: 1,
    scale_max: 5
  })
}

function closeCreateForm() {
  showCreateSystem.value = false
  systemForm.value = {
    name: '',
    description: '',
    category: 'model-behavior',
    permissions: 'public',
    criteria: []
  }
}

async function createSystem() {
  try {
    await rankingsAPI.create(systemForm.value)
    await loadRankingSystems()
    closeCreateForm()
  } catch (err) {
    console.error('Failed to create ranking system:', err)
  }
}

function canEdit(system: any): boolean {
  if (!authStore.isAuthenticated()) return false
  if (authStore.hasRole('admin')) return true
  return system.created_by === authStore.user?.id
}

function startEditSystem(system: any) {
  editingSystemId.value = system.id
  systemForm.value = {
    name: system.name,
    description: system.description,
    category: system.category,
    permissions: system.permissions,
    criteria: systemCriteria.value[system.id]?.map(c => ({
      name: c.name,
      description: c.description,
      scale_type: c.scale_type,
      scale_min: c.scale_min,
      scale_max: c.scale_max
    })) || []
  }
  showEditSystem.value = true
}

function closeEditForm() {
  showEditSystem.value = false
  editingSystemId.value = null
  systemForm.value = {
    name: '',
    description: '',
    category: 'model-behavior',
    permissions: 'public',
    criteria: []
  }
}

async function updateSystem() {
  if (!editingSystemId.value) return
  
  try {
    await rankingsAPI.update(editingSystemId.value, systemForm.value)
    await loadRankingSystems()
    closeEditForm()
  } catch (err) {
    console.error('Failed to update ranking system:', err)
  }
}
</script>

