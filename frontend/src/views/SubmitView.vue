<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 p-4">
      <div class="max-w-4xl mx-auto flex items-center justify-between">
        <h1 class="text-2xl font-bold">Submit Conversation</h1>
        <button @click="router.push('/')" class="text-gray-600 hover:text-gray-900">
          ← Back
        </button>
      </div>
    </header>

    <div class="max-w-4xl mx-auto p-8">
      <div class="bg-white rounded-lg shadow p-6">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Title
          </label>
          <input
            v-model="title"
            type="text"
            placeholder="e.g., Claude on Non-duality"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Source Type
          </label>
          <select
            v-model="sourceType"
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
          >
            <option value="json-upload">JSON Upload</option>
            <option value="arc-certified">ARC Certified</option>
            <option value="discord">Discord</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Paste JSON (Anthropic format with messages array)
          </label>
          <textarea
            v-model="jsonInput"
            rows="12"
            placeholder='{"messages": [{"role": "user", "content": [{"type": "text", "text": "..."}]}, ...]}'
            class="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
          />
          <div class="text-xs text-gray-500 mt-1">
            Supports Anthropic API message format
          </div>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {{ error }}
        </div>

        <div v-if="previewMessages.length > 0" class="mb-6 p-4 bg-gray-50 rounded">
          <div class="text-sm font-medium text-gray-700 mb-2">
            Preview: {{ previewMessages.length }} messages
          </div>
          <div class="space-y-1 text-xs text-gray-600">
            <div v-for="(msg, idx) in previewMessages.slice(0, 3)" :key="idx">
              {{ msg.participant_name }}: {{ truncate(getMessageText(msg), 60) }}
            </div>
            <div v-if="previewMessages.length > 3" class="text-gray-500">
              ... and {{ previewMessages.length - 3 }} more
            </div>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="parseJSON"
            class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Parse & Preview
          </button>
          <button
            @click="submit"
            :disabled="!previewMessages.length || submitting"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Submitting...' : 'Submit Conversation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { submissionsAPI } from '@/services/api'
import type { Message } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const title = ref('')
const sourceType = ref<'json-upload' | 'arc-certified' | 'discord' | 'other'>('json-upload')
const jsonInput = ref('')
const previewMessages = ref<Message[]>([])
const error = ref('')
const submitting = ref(false)

function parseJSON() {
  error.value = ''
  previewMessages.value = []
  
  try {
    const data = JSON.parse(jsonInput.value)
    
    if (!data.messages || !Array.isArray(data.messages)) {
      error.value = 'JSON must have a "messages" array'
      return
    }
    
    // Convert Anthropic format to our format
    const converted: Message[] = []
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
      
      // Determine participant
      const participantName = msg.role === 'user' ? 'User' : 
                             msg.role === 'assistant' ? 'Assistant' : 
                             'System'
      const participantType = msg.role === 'assistant' ? 'model' : 'human'
      
      converted.push({
        id: messageId,
        submission_id: '', // Will be filled by server
        parent_message_id: parentId,
        order: idx,
        participant_name: participantName,
        participant_type: participantType as any,
        content_blocks: contentBlocks,
        model_info: msg.role === 'assistant' ? {
          model_id: 'claude-sonnet-3.5',
          provider: 'anthropic',
          reasoning_enabled: false
        } : undefined
      })
      
      parentId = messageId
    })
    
    previewMessages.value = converted
  } catch (err: any) {
    error.value = 'Invalid JSON: ' + err.message
  }
}

async function submit() {
  if (!authStore.isAuthenticated()) {
    router.push('/login')
    return
  }
  
  if (previewMessages.value.length === 0) {
    error.value = 'Please parse JSON first'
    return
  }
  
  submitting.value = true
  error.value = ''
  
  try {
    const response = await submissionsAPI.create({
      title: title.value || 'Untitled Conversation',
      source_type: sourceType.value,
      messages: previewMessages.value,
      metadata: {
        tags: []
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
