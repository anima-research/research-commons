<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />

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

    <div class="lg:ml-64">
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 transition-colors">
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">✨ New Conversation</h1>
      </header>

      <div class="max-w-4xl mx-auto p-8">
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow border border-gray-200 dark:border-gray-800 p-6 transition-colors">
        
        <!-- Step 1: Upload -->
        <div v-if="step === 'upload'">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Conversation</h2>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Source Type
            </label>
            <select
              v-model="sourceType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              <option value="json-upload">JSON Upload</option>
              <option value="arc-certified">ARC Certified</option>
              <option value="discord">Discord</option>
              <option value="other">Other</option>
            </select>
          </div>

          <!-- Discord Import -->
          <div v-if="sourceType === 'discord'" class="space-y-4 mb-6">
            <div class="p-3 bg-gray-800/50 border border-gray-700 rounded text-sm text-gray-400">
              <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              Discord integration configured server-side. Imports are authenticated and secure.
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Last Message URL <span class="text-red-400">*</span>
              </label>
              <input
                v-model="discordLastMessageUrl"
                type="text"
                placeholder="https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p class="mt-1 text-xs text-gray-500">The ending message URL (most recent)</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                First Message URL <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model="discordFirstMessageUrl"
                type="text"
                placeholder="https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p class="mt-1 text-xs text-gray-500">The starting message URL (oldest) - leave empty for all messages</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Max Messages <span class="text-gray-500">(optional)</span>
              </label>
              <input
                v-model.number="discordMaxMessages"
                type="number"
                min="1"
                placeholder="400"
                class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <p class="mt-1 text-xs text-gray-500">Maximum number of messages to import</p>
            </div>
          </div>

          <!-- JSON Upload -->
          <div v-if="sourceType === 'json-upload' || sourceType === 'arc-certified' || sourceType === 'other'" class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload JSON File (Anthropic format)
            </label>
            <div class="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-800 transition-colors hover:border-indigo-400 dark:hover:border-indigo-600">
              <input
                type="file"
                accept=".json,.txt"
                @change="handleFileUpload"
                class="hidden"
                ref="fileInput"
              />
              <button
                type="button"
                @click="($refs.fileInput as any)?.click()"
                class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                📁 Choose JSON File
              </button>
              <p v-if="uploadedFile" class="mt-3 text-sm text-gray-900 dark:text-gray-100 font-medium">
                ✓ {{ uploadedFile.name }}
              </p>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Supports Anthropic API message format with "messages" array
              </p>
            </div>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm transition-colors">
            {{ error }}
          </div>

          <div class="flex justify-end">
            <button
              v-if="sourceType === 'discord'"
              @click="fetchDiscordMessages"
              :disabled="!discordLastMessageUrl || submitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Fetching...' : 'Fetch Messages →' }}
            </button>
            <button
              v-else
              @click="parseJSON"
              :disabled="!uploadedFile"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Parse & Continue →
            </button>
          </div>
        </div>

        <!-- Step 2: Configure -->
        <div v-if="step === 'configure'">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Configure Submission</h2>
            <button
              @click="resetToUpload"
              class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              ← Back to Upload
            </button>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              v-model="title"
              type="text"
              placeholder="e.g., Claude on Non-duality"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="What makes this conversation interesting or noteworthy?"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Research Topics
            </label>
            <div class="space-y-2 max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-800 transition-colors">
              <label
                v-for="topic in availableTopics"
                :key="topic.id"
                class="flex items-start gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded transition-colors"
              >
                <input
                  type="checkbox"
                  :value="topic.name"
                  v-model="selectedTopics"
                  class="w-4 h-4 mt-0.5"
                />
                <div class="flex-1">
                  <div class="text-sm text-gray-900 dark:text-gray-100">{{ topic.name }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ topic.description }}</div>
                </div>
              </label>
              <div v-if="availableTopics.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                No topics available
              </div>
            </div>
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Identify Participants
              <span class="text-xs text-gray-500 dark:text-gray-400 font-normal ml-2">
                (Map each participant to a model or mark as human)
              </span>
            </label>
            <div class="space-y-2">
              <div
                v-for="name in participantNames"
                :key="name"
                class="p-3 border border-gray-300 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div class="flex items-center gap-2 mb-2">
                  <!-- Avatar -->
                  <img
                    v-if="getParticipantAvatar(name)"
                    :src="getParticipantAvatar(name)"
                    class="w-8 h-8 rounded-full border border-gray-600"
                    :alt="name"
                  />
                  <div v-else class="w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-sm font-medium text-gray-300">
                    {{ name.charAt(0).toUpperCase() }}
                  </div>
                  
                  <!-- Names -->
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-gray-100">
                      {{ getParticipantDisplayName(name) }}
                    </div>
                    <div class="text-xs text-gray-400">
                      @{{ getParticipantUsername(name) }}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2">
                  <div class="flex-1 flex gap-2">
                    <select
                      v-model="participantMapping[name]"
                      class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
                    >
                      <option value="">-- Select Type --</option>
                      <option value="human">👤 Human</option>
                      <optgroup label="AI Models" class="text-gray-900 dark:text-gray-100">
                        <option 
                          v-for="model in availableModels" 
                          :key="model.id" 
                          :value="model.id"
                        >
                          {{ model.avatar && !model.avatar.startsWith('http') ? model.avatar + ' ' : '' }}{{ model.name }}
                        </option>
                      </optgroup>
                    </select>
                    <button
                      v-if="participantMapping[name] && participantMapping[name] !== 'human' && getParticipantAvatar(name)"
                      @click="updateModelAvatar(name, participantMapping[name])"
                      class="px-3 py-2 border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded text-xs transition-all flex items-center gap-1 shrink-0"
                      title="Update model avatar from Discord"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Update Avatar
                    </button>
                  </div>
                  <button
                    v-if="authStore.user?.roles.includes('admin') || authStore.user?.roles.includes('researcher')"
                    @click="openCreateModelForParticipant(name)"
                    class="px-3 py-2 border border-indigo-500/50 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded text-xs transition-all flex items-center gap-1 shrink-0"
                    title="Create new model for this participant"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    New
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Create Model Modal -->
          <div v-if="showCreateModel" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" @click.self="showCreateModel = false">
            <div class="bg-gray-900 rounded-lg border border-gray-700 p-6 max-w-md w-full mx-4">
              <h3 class="text-lg font-semibold text-gray-100 mb-4">
                Create Model{{ creatingModelForParticipant ? ` for "${creatingModelForParticipant}"` : '' }}
              </h3>
              
              <!-- Avatar Preview -->
              <div v-if="newModel.avatar" class="mb-4 flex items-center gap-3 p-3 bg-gray-800 rounded border border-gray-700">
                <img :src="newModel.avatar" class="w-12 h-12 rounded-full" alt="Model avatar" />
                <div class="text-sm text-gray-400">Avatar from Discord profile</div>
              </div>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Model Name</label>
                  <input
                    v-model="newModel.name"
                    type="text"
                    placeholder="GPT-4, Claude 3.5, etc."
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <input
                    v-model="newModel.description"
                    type="text"
                    placeholder="Brief description"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Provider</label>
                  <select
                    v-model="newModel.provider"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                    <option value="meta">Meta</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Model ID</label>
                  <input
                    v-model="newModel.model_id"
                    type="text"
                    placeholder="e.g., gpt-4, claude-3-5-sonnet"
                    class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-1">Color</label>
                  <input
                    v-model="newModel.color"
                    type="color"
                    class="w-full h-10 border border-gray-700 rounded bg-gray-800 cursor-pointer"
                  />
                </div>
              </div>
              
              <div class="flex gap-3 mt-6">
                <button
                  @click="cancelCreateModel"
                  class="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  @click="createNewModel"
                  :disabled="!newModel.name || !newModel.provider || !newModel.model_id"
                  class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Model
                </button>
              </div>
            </div>
          </div>

          <div v-if="previewMessages.length > 0" class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
            <div class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              📝 Preview: {{ previewMessages.length }} messages
            </div>
            <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div v-for="(msg, idx) in previewMessages.slice(0, 5)" :key="idx" class="flex items-start gap-2">
                <span 
                  v-if="participantMapping[msg.participant_name] && participantMapping[msg.participant_name] !== 'human'"
                  class="text-lg"
                >
                  {{ getModelAvatar(participantMapping[msg.participant_name]) }}
                </span>
                <span v-else>👤</span>
                <span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">{{ msg.participant_name }}</span>: 
                  {{ truncate(getMessageText(msg), 50) }}
                </span>
              </div>
              <div v-if="previewMessages.length > 5" class="text-gray-500 dark:text-gray-400 mt-2">
                ... and {{ previewMessages.length - 5 }} more
              </div>
            </div>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm transition-colors">
            {{ error }}
          </div>

          <div class="flex gap-3">
            <button
              @click="resetToUpload"
              class="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="submit"
              :disabled="!title || !allParticipantsMapped || submitting"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ submitting ? 'Uploading...' : 'Upload Conversation' }}
            </button>
          </div>
        </div>

      </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { submissionsAPI, researchAPI, modelsAPI, importsAPI } from '@/services/api'
import type { Message } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const fileInput = ref<HTMLInputElement>()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await Promise.all([
    loadTopics(),
    loadModels()
  ])
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadTopics() {
  try {
    const response = await researchAPI.getTopics()
    availableTopics.value = response.data.topics
    
    // Auto-select first topic if none selected
    if (selectedTopics.value.length === 0 && response.data.topics.length > 0) {
      selectedTopics.value = [response.data.topics[0].id]
      console.log('[Submit] Auto-selected default topic:', response.data.topics[0].name)
    }
  } catch (err) {
    console.error('Failed to load topics:', err)
  }
}

async function loadModels() {
  try {
    const response = await modelsAPI.list()
    availableModels.value = response.data.models
  } catch (err) {
    console.error('Failed to load models:', err)
  }
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  uploadedFile.value = file
  error.value = ''
}

function resetToUpload() {
  step.value = 'upload'
  title.value = ''
  description.value = ''
  selectedTopics.value = []
  participantMapping.value = {}
  previewMessages.value = []
  participantNames.value = []
  error.value = ''
}

const title = ref('')
const description = ref('')
const sourceType = ref<'json-upload' | 'arc-certified' | 'discord' | 'other'>('json-upload')
const selectedTopics = ref<string[]>([])
const availableTopics = ref<any[]>([])
const availableModels = ref<any[]>([])
const uploadedFile = ref<File | null>(null)
const previewMessages = ref<Message[]>([])
const participantNames = ref<string[]>([])
const participantMapping = ref<Record<string, string>>({}) // participantName -> modelId or 'human'
const error = ref('')
const submitting = ref(false)
const step = ref<'upload' | 'configure'>('upload')

// Discord import fields
const discordLastMessageUrl = ref('')
const discordFirstMessageUrl = ref('')
const discordMaxMessages = ref<number | undefined>(undefined)
const discordParticipantsWithIds = ref<Array<{ 
  name: string; 
  discord_user_id: string; 
  username: string;
  display_name: string;
  is_bot: boolean;
  avatar_url?: string;
}>>([])

// Model creation
const showCreateModel = ref(false)
const creatingModelForParticipant = ref<string | null>(null)
const newModel = ref({
  name: '',
  description: '',
  provider: 'other' as 'anthropic' | 'openai' | 'google' | 'meta' | 'other',
  model_id: '',
  avatar: '',
  color: '#8b5cf6' // Will be randomized on open
})

const allParticipantsMapped = computed(() => {
  return participantNames.value.every(name => participantMapping.value[name])
})

function getModelAvatar(modelId: string): string {
  const model = availableModels.value.find(m => m.id === modelId)
  return model?.avatar || '🤖'
}

function getParticipantAvatar(participantName: string): string | undefined {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.avatar_url
}

function getParticipantUsername(participantName: string): string {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.username || participantName
}

function getParticipantDisplayName(participantName: string): string {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  return participant?.display_name || participantName
}

async function updateModelAvatar(participantName: string, modelId: string) {
  const participant = discordParticipantsWithIds.value.find(p => p.name === participantName)
  if (!participant?.avatar_url) {
    console.error('[Model] No avatar URL for participant:', participantName)
    return
  }
  
  const model = availableModels.value.find(m => m.id === modelId)
  if (!model) {
    console.error('[Model] Model not found:', modelId)
    return
  }
  
  try {
    // Update the model's avatar - send full model data
    await modelsAPI.update(modelId, {
      name: model.name,
      description: model.description,
      provider: model.provider,
      model_id: model.model_id,
      avatar: participant.avatar_url,
      color: model.color
    })
    
    // Update in local models list
    const modelIndex = availableModels.value.findIndex(m => m.id === modelId)
    if (modelIndex !== -1) {
      availableModels.value[modelIndex].avatar = participant.avatar_url
    }
    
    console.log('[Model] Updated avatar for model:', modelId, 'from Discord user:', participantName)
  } catch (err: any) {
    console.error('[Model] Failed to update avatar:', err)
    error.value = 'Failed to update model avatar: ' + (err.response?.data?.error || err.message)
  }
}

// Color palette for models - curated for variety and visual distinction
const MODEL_COLOR_PALETTE = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Green
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#ef4444', // Red
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#84cc16', // Lime
  '#f43f5e', // Rose
  '#a855f7', // Violet
  '#0ea5e9', // Sky
  '#22c55e', // Emerald
  '#eab308'  // Yellow
]

function getRandomColor(): string {
  return MODEL_COLOR_PALETTE[Math.floor(Math.random() * MODEL_COLOR_PALETTE.length)]
}

function detectProvider(participantName: string): 'anthropic' | 'openai' | 'google' | 'meta' | 'other' {
  const nameLower = participantName.toLowerCase()
  
  // Anthropic heuristics
  if (nameLower.includes('claude') || nameLower.includes('opus') || 
      nameLower.includes('sonnet') || nameLower.includes('haiku')) {
    return 'anthropic'
  }
  
  // OpenAI heuristics
  if (nameLower.includes('gpt') || nameLower.includes('o3') || 
      nameLower.includes('4o') || nameLower.includes('chatgpt')) {
    return 'openai'
  }
  
  // Google heuristics
  if (nameLower.includes('gemini') || nameLower.includes('gem') || 
      nameLower.includes('bard') || nameLower.includes('palm')) {
    return 'google'
  }
  
  // Meta heuristics
  if (nameLower.includes('llama') || nameLower.includes('meta')) {
    return 'meta'
  }
  
  return 'other'
}

function openCreateModelForParticipant(participantName: string) {
  creatingModelForParticipant.value = participantName
  
  // Smart provider detection
  const detectedProvider = detectProvider(participantName)
  
  // Get participant info including avatar
  const participantInfo = discordParticipantsWithIds.value.find(p => p.name === participantName)
  
  // Pre-populate with participant name, random color, and Discord avatar
  newModel.value = {
    name: participantName,
    description: '',
    provider: detectedProvider,
    model_id: participantName.toLowerCase().replace(/\s+/g, '-'),
    color: getRandomColor(),
    avatar: participantInfo?.avatar_url || ''
  }
  
  showCreateModel.value = true
}

function cancelCreateModel() {
  showCreateModel.value = false
  creatingModelForParticipant.value = null
  newModel.value = {
    name: '',
    description: '',
    provider: 'other',
    model_id: '',
    avatar: '',
    color: getRandomColor()
  }
}

async function createNewModel() {
  if (!newModel.value.name || !newModel.value.provider || !newModel.value.model_id) {
    return
  }
  
  try {
    const response = await modelsAPI.create({
      name: newModel.value.name,
      description: newModel.value.description,
      provider: newModel.value.provider,
      model_id: newModel.value.model_id,
      avatar: newModel.value.avatar,
      color: newModel.value.color
    })
    
    // Add to available models
    availableModels.value.push(response.data)
    
    // Auto-map to the participant we're creating this for
    if (creatingModelForParticipant.value) {
      participantMapping.value[creatingModelForParticipant.value] = response.data.id
    }
    
    // Reset form
    newModel.value = {
      name: '',
      description: '',
      provider: 'other',
      model_id: '',
      avatar: '',
      color: getRandomColor()
    }
    
    creatingModelForParticipant.value = null
    showCreateModel.value = false
    
    console.log('[Model] Created new model:', response.data)
  } catch (err: any) {
    console.error('[Model] Failed to create model:', err)
    error.value = 'Failed to create model: ' + (err.response?.data?.error || err.message)
  }
}

async function parseJSON() {
  if (!uploadedFile.value) {
    error.value = 'Please select a file first'
    return
  }
  
  error.value = ''
  previewMessages.value = []
  
  try {
    const text = await uploadedFile.value.text()
    const data = JSON.parse(text)
    
    if (!data.messages || !Array.isArray(data.messages)) {
      error.value = 'JSON must have a "messages" array'
      return
    }
    
    // Convert Anthropic format to our format
    const converted: Message[] = []
    const participants = new Set<string>()
    let parentId: string | null = null
    
    data.messages.forEach((msg: any, idx: number) => {
      const messageId = crypto.randomUUID()
      
      // Extract content blocks
      let contentBlocks = []
      if (Array.isArray(msg.content)) {
        contentBlocks = msg.content
      } else if (typeof msg.content === 'string') {
        contentBlocks = [{ type: 'text', text: msg.content }]
      }
      
      // Determine participant (but don't assume type yet)
      const participantName = msg.role === 'user' ? 'User' : 
                             msg.role === 'assistant' ? 'Assistant' : 
                             msg.role || 'Unknown'
      participants.add(participantName)
      
      converted.push({
        id: messageId,
        submission_id: '', // Will be filled by server
        parent_message_id: parentId,
        order: idx,
        participant_name: participantName,
        participant_type: 'human' as any, // Will be updated based on selection
        content_blocks: contentBlocks,
        model_info: undefined // Will be set if this is the model
      })
      
      parentId = messageId
    })
    
    previewMessages.value = converted
    participantNames.value = Array.from(participants)
    
    // Auto-map "Assistant" to Claude if available
    if (participantNames.value.includes('Assistant') && availableModels.value.length > 0) {
      const claude = availableModels.value.find(m => m.name.includes('Claude'))
      if (claude) {
        participantMapping.value['Assistant'] = claude.id
      }
    }
    
    // Auto-map "User" to human
    if (participantNames.value.includes('User')) {
      participantMapping.value['User'] = 'human'
    }
    
    step.value = 'configure'
  } catch (err: any) {
    error.value = 'Invalid JSON: ' + err.message
  }
}

async function fetchDiscordMessages() {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  if (!discordLastMessageUrl.value) {
    error.value = 'Please enter the last message URL'
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    console.log('[Discord Import] Fetching messages with params:', {
      last: discordLastMessageUrl.value,
      first: discordFirstMessageUrl.value,
      maxMessages: discordMaxMessages.value
    })
    
    // Fetch messages from Discord API through our backend (server-side credentials)
    const response = await importsAPI.fetchDiscordMessages({
      lastMessageUrl: discordLastMessageUrl.value,
      firstMessageUrl: discordFirstMessageUrl.value || undefined,
      maxMessages: discordMaxMessages.value
    })
    
    console.log('[Discord Import] Fetched messages:', response.data)
    
    // Store participant info with Discord IDs
    discordParticipantsWithIds.value = response.data.metadata.participants_with_ids || []
    
    // Convert to preview format
    previewMessages.value = response.data.messages
    
    // Extract unique participants
    const participants = new Set<string>()
    response.data.messages.forEach((msg: any) => {
      participants.add(msg.participant_name)
    })
    participantNames.value = Array.from(participants)
    
    // Use existing mappings first (keyed by Discord user ID), then auto-detect
    participantMapping.value = {}
    const existingMappingsByUserId = response.data.existing_mappings_by_user_id || {}
    
    console.log('[Discord Import] Applying mappings for participants:', participantNames.value)
    console.log('[Discord Import] Existing mappings by user ID:', existingMappingsByUserId)
    
    participantNames.value.forEach(name => {
      // Find participant info to get Discord user ID
      const participantInfo = discordParticipantsWithIds.value.find(p => p.name === name)
      
      if (!participantInfo) {
        console.log(`[Discord Import] No participant info for ${name}`)
        return
      }
      
      // Check if we have an existing mapping for this Discord user ID
      const existingMapping = existingMappingsByUserId[participantInfo.discord_user_id]
      
      if (existingMapping) {
        console.log(`[Discord Import] Found existing mapping for ${name} (${participantInfo.discord_user_id}):`, existingMapping)
        if (existingMapping.is_human) {
          participantMapping.value[name] = 'human'
        } else if (existingMapping.model_id) {
          participantMapping.value[name] = existingMapping.model_id
        }
        console.log(`[Discord Import] Applied mapping: ${name} → ${participantMapping.value[name]}`)
      } else {
        console.log(`[Discord Import] No existing mapping for ${name}, auto-detecting...`)
        // Auto-detect for new participants
        const msg = response.data.messages.find((m: any) => m.participant_name === name)
        if (msg) {
          if (msg.participant_type === 'model' && msg.model_info) {
            // Try to find existing model by name
            const existingModel = availableModels.value.find(
              m => m.name === msg.model_info.model_id || m.model_id === msg.model_info.model_id
            )
            if (existingModel) {
              participantMapping.value[name] = existingModel.id
            }
          } else if (msg.participant_type === 'human') {
            participantMapping.value[name] = 'human'
          }
        }
      }
    })
    
    // Set default title from Discord
    if (!title.value && response.data.title) {
      title.value = response.data.title
    }
    
    // Move to configure step
    step.value = 'configure'
  } catch (err: any) {
    console.error('[Discord Import] Fetch failed:', err)
    error.value = err.response?.data?.error || err.message || 'Failed to fetch Discord messages'
  } finally {
    submitting.value = false
  }
}

async function submit() {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  if (!title.value) {
    error.value = 'Title is required'
    return
  }
  
  // Check all participants are mapped
  const unmapped = participantNames.value.filter(name => !participantMapping.value[name])
  if (unmapped.length > 0) {
    error.value = `Please identify all participants: ${unmapped.join(', ')}`
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    // Update messages with correct participant types and model info
    const updatedMessages = previewMessages.value.map(msg => {
      const mapping = participantMapping.value[msg.participant_name]
      const isHuman = mapping === 'human'
      const modelData = isHuman ? null : availableModels.value.find(m => m.id === mapping)
      
      return {
        ...msg,
        participant_type: isHuman ? 'human' : 'model',
        model_info: modelData ? {
          model_id: modelData.model_id,
          provider: modelData.provider,
          reasoning_enabled: false
        } : undefined
      }
    })
    
    const response = await submissionsAPI.create({
      title: title.value,
      source_type: sourceType.value,
      messages: updatedMessages,
      metadata: {
        tags: selectedTopics.value,
        description: description.value || undefined
      }
    })
    
    // Save participant mappings if this was a Discord import
    if (sourceType.value === 'discord' && discordParticipantsWithIds.value.length > 0) {
      try {
        const mappingsToSave = discordParticipantsWithIds.value.map(participant => {
          const mapping = participantMapping.value[participant.name]
          return {
            source_user_id: participant.discord_user_id,
            source_username: participant.username,
            source_display_name: participant.display_name,
            avatar_url: participant.avatar_url,
            model_id: mapping === 'human' ? undefined : mapping,
            is_human: mapping === 'human'
          }
        }).filter(m => m.model_id || m.is_human) // Only save if mapped
        
        if (mappingsToSave.length > 0) {
          await importsAPI.saveMappings('discord', mappingsToSave)
          console.log('[Discord Import] Saved', mappingsToSave.length, 'participant mappings')
        }
      } catch (err) {
        console.error('[Discord Import] Failed to save mappings:', err)
        // Don't block submission on mapping save failure
      }
    }
    
    // Navigate to the new submission
    router.push(`/submissions/${response.data.id}`)
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to submit'
    console.error('Submit error:', err)
  } finally {
    submitting.value = false
  }
}

function getMessageText(msg: Message): string {
  const textBlock = msg.content_blocks.find(b => b.type === 'text')
  return textBlock?.text || ''
}

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text
}
</script>
