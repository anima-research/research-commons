<template>
  <div
    v-if="show"
    class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    @click.self="emit('cancel')"
  >
    <div class="bg-gray-900 rounded-lg border border-gray-700 max-w-3xl w-full max-h-[90vh] flex flex-col" @click.stop>
      <!-- Header -->
      <div class="p-4 border-b border-gray-700 flex items-center justify-between shrink-0">
        <div>
          <h3 class="text-lg font-semibold text-gray-100">Extend Conversation</h3>
          <p class="text-sm text-gray-400 mt-1">Add earlier or later messages from Discord</p>
        </div>
        <button @click="emit('cancel')" class="text-gray-400 hover:text-gray-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Step 1: Configuration -->
        <div v-if="step === 'config'" class="space-y-4">
          <!-- Direction selector -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Direction</label>
            <div class="flex gap-2">
              <button
                @click="direction = 'earlier'"
                :class="[
                  'flex-1 px-4 py-3 rounded border text-sm font-medium transition-all',
                  direction === 'earlier'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
                ]"
              >
                <span class="text-lg mr-2">⬆️</span>
                Earlier Messages
                <span class="block text-xs text-gray-500 mt-1">Add messages before the conversation</span>
              </button>
              <button
                @click="direction = 'later'"
                :class="[
                  'flex-1 px-4 py-3 rounded border text-sm font-medium transition-all',
                  direction === 'later'
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                    : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:border-gray-600'
                ]"
              >
                <span class="text-lg mr-2">⬇️</span>
                Later Messages
                <span class="block text-xs text-gray-500 mt-1">Add messages after the conversation</span>
              </button>
            </div>
          </div>

          <!-- Target URL (optional for earlier, required for later) -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Target Message URL
              <span v-if="direction === 'later'" class="text-red-400 ml-1">*</span>
              <span v-else class="text-gray-500 ml-2">(optional)</span>
            </label>
            <input
              v-model="targetUrl"
              type="text"
              :placeholder="direction === 'earlier' 
                ? 'Leave empty to fetch the last N messages before...' 
                : 'https://discord.com/channels/GUILD/CHANNEL/MESSAGE_ID'"
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-1">
              {{ direction === 'earlier' 
                ? 'How far back to extend (oldest message to include)' 
                : 'The new end point of the conversation' }}
            </p>
          </div>

          <!-- Message limit -->
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">
              Maximum Messages
            </label>
            <input
              v-model.number="limit"
              type="number"
              min="1"
              max="100"
              class="w-32 px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 mt-1">Maximum number of messages to fetch (1-100)</p>
          </div>

          <!-- Error display -->
          <div v-if="error" class="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">
            {{ error }}
          </div>
        </div>

        <!-- Step 2: Preview -->
        <div v-else-if="step === 'preview'" class="space-y-4">
          <!-- Preview info -->
          <div class="p-3 bg-blue-900/20 border border-blue-700/50 rounded text-blue-200 text-sm">
            <strong>{{ previewMessages.length }}</strong> new messages found
            <span v-if="previewTruncated" class="text-amber-400 ml-2">
              (truncated - more messages may exist)
            </span>
          </div>

          <!-- New participants (if any) -->
          <div v-if="newParticipantNames.length > 0" class="space-y-2">
            <div class="text-sm font-medium text-amber-400">
              ⚠️ New Participants Found
            </div>
            <ParticipantMappingForm
              :participant-names="newParticipantNames"
              :mapping="participantMapping"
              :models="models"
              :participants-info="newParticipantsInfo"
              :allow-create-model="allowCreateModel"
              :show-label="false"
              :show-completion-status="true"
              @update:mapping="participantMapping = $event"
              @create-model="emit('create-model', $event)"
              @update-avatar="(name, modelId) => emit('update-avatar', name, modelId)"
            />
          </div>

          <!-- Message preview list -->
          <div class="border border-gray-700 rounded overflow-hidden">
            <div class="bg-gray-800/50 px-3 py-2 border-b border-gray-700 text-sm font-medium text-gray-300">
              Messages to Add
              <span class="text-gray-500 font-normal ml-2">
                ({{ direction === 'earlier' ? 'oldest first' : 'oldest first' }})
              </span>
            </div>
            <div class="max-h-64 overflow-y-auto">
              <div
                v-for="(msg, idx) in previewMessages"
                :key="msg.id || idx"
                class="px-3 py-2 border-b border-gray-700/50 last:border-b-0 hover:bg-gray-800/30 transition-colors"
              >
                <div class="flex items-start gap-2">
                  <img
                    v-if="msg.metadata?.avatar_url"
                    :src="msg.metadata.avatar_url"
                    class="w-6 h-6 rounded-full shrink-0"
                    :alt="msg.participant_name"
                  />
                  <div v-else class="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400 shrink-0">
                    {{ msg.participant_name?.charAt(0) || '?' }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 mb-1">
                      <span class="font-medium text-sm text-gray-200">{{ msg.participant_name }}</span>
                      <span class="text-xs text-gray-500">{{ formatTimestamp(msg.timestamp) }}</span>
                    </div>
                    <div class="text-sm text-gray-400 line-clamp-2">
                      {{ getMessageText(msg) || '[No text content]' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Error display -->
          <div v-if="error" class="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-400 text-sm">
            {{ error }}
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500"></div>
          <span class="ml-3 text-gray-400">{{ loadingMessage }}</span>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-700 flex justify-between items-center shrink-0">
        <div>
          <button
            v-if="step === 'preview'"
            @click="step = 'config'"
            class="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            ← Back
          </button>
        </div>
        <div class="flex gap-3">
          <button
            @click="emit('cancel')"
            class="px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            v-if="step === 'config'"
            @click="fetchPreview"
            :disabled="loading || (direction === 'later' && !targetUrl)"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Loading...' : 'Preview Messages →' }}
          </button>
          <button
            v-else-if="step === 'preview'"
            @click="confirmExtend"
            :disabled="loading || !allNewParticipantsMapped"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Extending...' : `Add ${previewMessages.length} Messages` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Message } from '@/types'
import { submissionsAPI, modelsAPI } from '@/services/api'
import ParticipantMappingForm from '@/components/ParticipantMappingForm.vue'

interface Props {
  show: boolean
  submissionId: string
  allowCreateModel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  allowCreateModel: true
})

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'extended', data: { addedCount: number; totalCount: number }): void
  (e: 'create-model', participantName: string): void
  (e: 'update-avatar', participantName: string, modelId: string): void
}>()

// State
const step = ref<'config' | 'preview'>('config')
const direction = ref<'earlier' | 'later'>('earlier')
const targetUrl = ref('')
const limit = ref(50)
const loading = ref(false)
const loadingMessage = ref('')
const error = ref('')

// Preview data
const previewMessages = ref<Message[]>([])
const previewTruncated = ref(false)
const previewMetadata = ref<any>(null)
const existingMappings = ref<Record<string, { model_id?: string; is_human: boolean; avatar_url?: string }>>({})

// Models and participant mapping
const models = ref<any[]>([])
const participantMapping = ref<Record<string, string>>({})

// Computed: identify new participants (not already in existing messages)
const newParticipantsInfo = computed(() => {
  const participants = previewMetadata.value?.participants_with_ids || []
  return participants as Array<{
    name: string
    discord_user_id: string
    username: string
    display_name: string
    is_bot: boolean
    avatar_url?: string
  }>
})

const newParticipantNames = computed(() => {
  return newParticipantsInfo.value.map((p: any) => p.name)
})

const allNewParticipantsMapped = computed(() => {
  if (newParticipantNames.value.length === 0) return true
  return newParticipantNames.value.every(name => participantMapping.value[name])
})

// Watch for show to reset state
watch(() => props.show, (newVal) => {
  if (newVal) {
    resetState()
    loadModels()
  }
})

function resetState() {
  step.value = 'config'
  direction.value = 'earlier'
  targetUrl.value = ''
  limit.value = 50
  loading.value = false
  error.value = ''
  previewMessages.value = []
  previewTruncated.value = false
  previewMetadata.value = null
  existingMappings.value = {}
  participantMapping.value = {}
}

async function loadModels() {
  try {
    const response = await modelsAPI.list()
    models.value = response.data.models
  } catch (err) {
    console.error('Failed to load models:', err)
  }
}

async function fetchPreview() {
  if (direction.value === 'later' && !targetUrl.value) {
    error.value = 'Please provide a target message URL for later extension'
    return
  }

  loading.value = true
  loadingMessage.value = 'Fetching messages from Discord...'
  error.value = ''

  try {
    const response = await submissionsAPI.extendPreview(props.submissionId, {
      direction: direction.value,
      messageUrl: targetUrl.value || undefined,
      limit: limit.value
    })

    previewMessages.value = response.data.messages
    previewTruncated.value = response.data.truncated
    previewMetadata.value = response.data.metadata
    existingMappings.value = response.data.existingMappings || {}

    // Auto-apply existing mappings
    for (const participant of newParticipantsInfo.value) {
      const existing = existingMappings.value[participant.discord_user_id]
      if (existing) {
        if (existing.is_human) {
          participantMapping.value[participant.name] = 'human'
        } else if (existing.model_id) {
          participantMapping.value[participant.name] = existing.model_id
        }
      } else if (participant.is_bot) {
        // Auto-detect bots - try to find matching model
        const matchingModel = models.value.find(m => 
          m.name.toLowerCase().includes(participant.name.toLowerCase()) ||
          participant.name.toLowerCase().includes(m.name.toLowerCase())
        )
        if (matchingModel) {
          participantMapping.value[participant.name] = matchingModel.id
        }
      }
    }

    if (previewMessages.value.length === 0) {
      error.value = 'No new messages found in the specified range'
      return
    }

    step.value = 'preview'
  } catch (err: any) {
    console.error('Preview failed:', err)
    error.value = err.response?.data?.message || err.response?.data?.error || 'Failed to fetch preview'
  } finally {
    loading.value = false
  }
}

async function confirmExtend() {
  if (!allNewParticipantsMapped.value) {
    error.value = 'Please map all new participants before extending'
    return
  }

  loading.value = true
  loadingMessage.value = 'Adding messages to conversation...'
  error.value = ''

  try {
    const response = await submissionsAPI.extend(props.submissionId, {
      direction: direction.value,
      messageUrl: targetUrl.value || undefined,
      limit: limit.value,
      participantMapping: participantMapping.value
    })

    emit('extended', {
      addedCount: response.data.addedCount,
      totalCount: response.data.totalCount
    })
  } catch (err: any) {
    console.error('Extend failed:', err)
    error.value = err.response?.data?.message || err.response?.data?.error || 'Failed to extend conversation'
    loading.value = false
  }
}

// Helper functions
function getMessageText(msg: Message): string {
  const textBlock = msg.content_blocks?.find(b => b.type === 'text')
  return textBlock?.text || ''
}

function formatTimestamp(timestamp: string | Date | undefined): string {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}
</script>

