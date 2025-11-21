<template>
  <div class="min-h-screen bg-gray-950">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />
    
    <div class="lg:ml-64">
      <header class="bg-gray-900 border-b border-gray-800 p-4">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-100">🤖 AI Models</h1>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateModel = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm transition-colors"
          >
            + Add Model
          </button>
        </div>
      </header>

      <div class="p-4 space-y-4">
        <div v-if="loading" class="text-center py-12 text-gray-400">
          Loading models...
        </div>

        <div v-else-if="models.length === 0" class="text-center py-12 text-gray-400">
          <p class="mb-4">No models registered yet.</p>
          <button
            v-if="authStore.hasRole('researcher')"
            @click="showCreateModel = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors"
          >
            Add First Model
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="model in models"
            :key="model.id"
            class="bg-gray-900 rounded-lg shadow-sm border border-gray-800 p-6 group"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <!-- Avatar - show image if URL, emoji otherwise -->
                <img
                  v-if="model.avatar && model.avatar.startsWith('http')"
                  :src="model.avatar"
                  class="w-12 h-12 rounded-full object-cover"
                  :alt="model.name"
                />
                <div 
                  v-else
                  class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  :style="{ backgroundColor: model.color + '20', color: model.color }"
                >
                  {{ model.avatar || '🤖' }}
                </div>
                <div>
                  <h3 class="font-semibold text-gray-100">{{ model.name }}</h3>
                  <p class="text-xs text-gray-400">{{ model.provider }}</p>
                </div>
              </div>
              <button
                v-if="canEdit(model)"
                @click="startEditModel(model)"
                class="opacity-0 group-hover:opacity-100 px-2 py-1 text-sm text-indigo-400 hover:text-indigo-300 transition-all"
              >
                ✏️
              </button>
            </div>
            
            <p class="text-sm text-gray-400 mb-2">{{ model.description || 'No description' }}</p>
            <code class="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
              {{ model.model_id }}
            </code>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Model Modal -->
    <Teleport to="body">
      <div
        v-if="showCreateModel || showEditModel"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showEditModel ? closeEditForm() : (showCreateModel = false)"
      >
        <div class="bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full p-6 border border-gray-700">
          <h3 class="text-lg font-semibold text-gray-100 mb-4">
            {{ showEditModel ? 'Edit' : 'Add' }} Model
          </h3>

          <div class="space-y-4 mb-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
                <input
                  v-model="modelForm.name"
                  type="text"
                  placeholder="e.g., Claude 3.5 Sonnet"
                  class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                <select
                  v-model="modelForm.provider"
                  class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="anthropic">Anthropic</option>
                  <option value="openai">OpenAI</option>
                  <option value="google">Google</option>
                  <option value="meta">Meta</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                v-model="modelForm.description"
                rows="2"
                placeholder="Brief description of this model (optional)"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Model ID</label>
              <input
                v-model="modelForm.model_id"
                type="text"
                placeholder="e.g., claude-3-5-sonnet-20241022"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Avatar</label>
                <input
                  v-model="modelForm.avatar"
                  type="text"
                  placeholder="🤖 or image URL"
                  class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                />
                <p class="mt-1 text-xs text-gray-500">Emoji or Discord avatar URL</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Color</label>
                <input
                  v-model="modelForm.color"
                  type="color"
                  class="w-full h-10 border border-gray-700 rounded cursor-pointer bg-gray-800"
                />
              </div>
            </div>

            <!-- Preview -->
            <div class="p-3 bg-gray-800 rounded border border-gray-700">
              <div class="text-xs text-gray-400 mb-2">Preview:</div>
              <div class="flex items-center gap-2">
                <!-- Avatar preview - show image if URL, emoji otherwise -->
                <img
                  v-if="modelForm.avatar && modelForm.avatar.startsWith('http')"
                  :src="modelForm.avatar"
                  class="w-10 h-10 rounded-full object-cover"
                  alt="Model avatar"
                />
                <div 
                  v-else
                  class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  :style="{ backgroundColor: modelForm.color + '20', color: modelForm.color }"
                >
                  {{ modelForm.avatar || '🤖' }}
                </div>
                <div>
                  <div class="font-medium text-sm text-gray-100">{{ modelForm.name || 'Model Name' }}</div>
                  <div class="text-xs text-gray-400">{{ modelForm.provider }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="showEditModel ? closeEditForm() : (showCreateModel = false)"
              class="px-4 py-2 border border-gray-700 text-gray-300 rounded hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="showEditModel"
              @click="updateModel"
              :disabled="!isValid"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Update Model
            </button>
            <button
              v-else
              @click="createModel"
              :disabled="!isValid"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 transition-colors"
            >
              Add Model
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
import { modelsAPI } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const models = ref<any[]>([])
const loading = ref(false)
const showMobileSidebar = ref(false)
const showCreateModel = ref(false)
const showEditModel = ref(false)
const editingModelId = ref<string | null>(null)

const modelForm = ref({
  name: '',
  description: '',
  provider: 'anthropic' as const,
  model_id: '',
  avatar: '🤖',
  color: '#6366f1'
})

const isValid = computed(() => {
  return modelForm.value.name && 
         modelForm.value.model_id
})

onMounted(async () => {
  await loadModels()
})

function handleNavigate(route: string) {
  router.push(route)
}

async function loadModels() {
  loading.value = true
  try {
    const response = await modelsAPI.list()
    models.value = response.data.models
  } catch (err) {
    console.error('Failed to load models:', err)
  } finally {
    loading.value = false
  }
}

function canEdit(model: any): boolean {
  if (!authStore.isAuthenticated()) return false
  if (authStore.hasRole('admin')) return true
  return model.created_by === authStore.user?.id
}

function startEditModel(model: any) {
  editingModelId.value = model.id
  modelForm.value = {
    name: model.name,
    description: model.description,
    provider: model.provider,
    model_id: model.model_id,
    avatar: model.avatar,
    color: model.color
  }
  showEditModel.value = true
}

function closeEditForm() {
  showEditModel.value = false
  editingModelId.value = null
  modelForm.value = {
    name: '',
    description: '',
    provider: 'anthropic',
    model_id: '',
    avatar: '🤖',
    color: '#6366f1'
  }
}

async function createModel() {
  try {
    await modelsAPI.create(modelForm.value)
    await loadModels()
    showCreateModel.value = false
    modelForm.value = {
      name: '',
      description: '',
      provider: 'anthropic',
      model_id: '',
      avatar: '🤖',
      color: '#6366f1'
    }
  } catch (err) {
    console.error('Failed to create model:', err)
  }
}

async function updateModel() {
  if (!editingModelId.value) return
  
  try {
    await modelsAPI.update(editingModelId.value, modelForm.value)
    await loadModels()
    closeEditForm()
  } catch (err) {
    console.error('Failed to update model:', err)
  }
}
</script>

