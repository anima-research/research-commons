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
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">📤 Submit Conversation</h1>
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

          <div class="mb-6">
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
                <div class="font-medium text-sm text-gray-900 dark:text-gray-100 mb-2">
                  {{ name }}
                </div>
                <select
                  v-model="participantMapping[name]"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 text-sm transition-colors"
                >
                  <option value="">-- Select Type --</option>
                  <option value="human">👤 Human</option>
                  <optgroup label="AI Models" class="text-gray-900 dark:text-gray-100">
                    <option 
                      v-for="model in availableModels" 
                      :key="model.id" 
                      :value="model.id"
                    >
                      {{ model.avatar }} {{ model.name }}
                    </option>
                  </optgroup>
                </select>
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
              {{ submitting ? 'Submitting...' : 'Submit Conversation' }}
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
import { submissionsAPI, researchAPI, modelsAPI } from '@/services/api'
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

const allParticipantsMapped = computed(() => {
  return participantNames.value.every(name => participantMapping.value[name])
})

function getModelAvatar(modelId: string): string {
  const model = availableModels.value.find(m => m.id === modelId)
  return model?.avatar || '🤖'
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
