<template>
  <div class="min-h-screen bg-gray-50">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />
    
    <div class="lg:ml-64">
      <header class="bg-white border-b p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold">⭐ Ranking Systems</h1>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateSystem = true"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm"
          >
            + Create Ranking System
          </button>
        </div>
      </header>

      <div class="p-4 space-y-4">
        <div v-if="loading" class="text-center py-12 text-gray-500">
          Loading ranking systems...
        </div>

        <div v-else-if="rankingSystems.length === 0" class="text-center py-12 text-gray-500">
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
            class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">{{ system.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ system.description }}</p>
                <div class="text-xs text-gray-500 mt-2">
                  Category: {{ system.category }} • {{ system.permissions }}
                </div>
              </div>
            </div>

            <!-- Criteria list -->
            <div v-if="systemCriteria[system.id]" class="mt-4 space-y-2">
              <div class="text-sm font-medium text-gray-700 mb-2">Criteria:</div>
              <div
                v-for="criterion in systemCriteria[system.id]"
                :key="criterion.id"
                class="text-sm bg-gray-50 rounded p-2"
              >
                <div class="font-medium text-gray-900">{{ criterion.name }}</div>
                <div class="text-xs text-gray-600">
                  {{ criterion.description }}
                  <span class="ml-2 text-gray-500">
                    ({{ criterion.scale_min }}-{{ criterion.scale_max }})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Ranking System Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateSystem"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        @click.self="showCreateSystem = false"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
          <h3 class="text-lg font-semibold mb-4">Create Ranking System</h3>

          <div class="space-y-4 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                v-model="systemForm.name"
                type="text"
                placeholder="e.g., Interview Quality Assessment"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                v-model="systemForm.description"
                rows="2"
                placeholder="What does this ranking system evaluate?"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                v-model="systemForm.category"
                class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
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
              <label class="text-sm font-medium text-gray-700">Criteria</label>
              <button
                @click="addCriterion"
                class="text-xs text-indigo-600 hover:text-indigo-700"
              >
                + Add Criterion
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(criterion, idx) in systemForm.criteria"
                :key="idx"
                class="border border-gray-200 rounded p-3"
              >
                <div class="flex gap-2 mb-2">
                  <input
                    v-model="criterion.name"
                    type="text"
                    placeholder="Criterion name"
                    class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                  <button
                    @click="systemForm.criteria.splice(idx, 1)"
                    class="text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
                <input
                  v-model="criterion.description"
                  type="text"
                  placeholder="Description"
                  class="w-full px-2 py-1 text-xs border border-gray-300 rounded mb-2"
                />
                <div class="flex gap-2">
                  <input
                    v-model.number="criterion.scale_min"
                    type="number"
                    placeholder="Min"
                    class="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  <input
                    v-model.number="criterion.scale_max"
                    type="number"
                    placeholder="Max"
                    class="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="closeCreateForm"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="createSystem"
              :disabled="!canCreate"
              class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
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
</script>

