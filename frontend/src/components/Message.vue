<template>
  <div 
    class="message-wrapper mb-6 flex"
    :class="{ 
      'justify-end': isUser,
      'justify-start': !isUser 
    }"
    :data-message-id="message.id"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- Message card (max 80% width, alternating alignment) -->
    <div 
      class="message-card group relative transition-all"
      :class="{
        'bg-indigo-500/10 border-indigo-500/20': isUser,
        'bg-gray-800/40 border-gray-700/40': !isUser,
        'ring-2 ring-indigo-400/50': hasAnnotation
      }"
      :style="{ maxWidth: '80%' }"
    >
      <!-- Participant header -->
      <div class="flex items-center gap-2 mb-2">
        
        <div 
          class="w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium"
          :class="{
            'bg-indigo-500 text-white': isUser,
            'bg-purple-500 text-white': !isUser && props.message.participant_type === 'model',
            'bg-gray-600 text-white': !isUser && props.message.participant_type !== 'model'
          }"
        >
          {{ props.message.participant_name.charAt(0) }}
        </div>
        <span class="text-sm font-medium text-gray-300">
          {{ props.message.participant_name }}
        </span>
        <span v-if="props.message.model_info" class="text-xs text-gray-500 font-mono">
          {{ props.message.model_info.model_id.split('-')[0] }}
        </span>
        <span class="text-xs text-gray-600 ml-auto">
          {{ formatTime(props.message.timestamp) }}
        </span>
        
        <!-- Actions trigger (hover, hidden in selection mode) -->
        <button
          v-if="!selectionMode"
          class="opacity-0 group-hover:opacity-40 hover:!opacity-100 text-gray-500 hover:text-gray-300 transition-all leading-none"
          @click.stop="toggleActions"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div 
        class="message-text text-gray-200 leading-relaxed"
        @mouseup="onTextSelect"
        ref="contentEl"
      >
        <template v-for="(block, idx) in message.content_blocks" :key="idx">
          <div v-if="block.type === 'text'" v-html="renderMarkdown(block.text || '')" class="prose prose-invert prose-sm max-w-none" />
          <div v-else-if="block.type === 'thinking'" class="mt-3 p-3 bg-gray-900/50 border border-gray-700/50 rounded text-xs">
            <div class="text-gray-500 mb-1 uppercase tracking-wide">Thinking</div>
            <div class="text-gray-400" v-html="renderMarkdown(block.thinking?.content || '')" />
          </div>
        </template>
      </div>

      <!-- Actions bar (floats on top, appears on hover) -->
      <transition name="fade">
        <div 
          v-if="showActions || actionsExpanded"
          class="absolute -top-2 right-2 flex items-center gap-1 bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 px-2 py-1"
          data-message-actions
        >
          <button 
            @click="addTag" 
            class="px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-all flex items-center gap-1.5"
            title="Add tag to message"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tag
          </button>
          <div class="w-px h-4 bg-gray-700" />
          <button 
            @click="addComment" 
            class="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-all flex items-center gap-1.5"
            title="Add comment to message"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Comment
          </button>
          <div class="w-px h-4 bg-gray-700" />
          <button 
            @click="copyMessage"
            class="px-2 py-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            title="Copy message"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Message } from '@/types'
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  message: Message
  hasAnnotation?: boolean
  hasBranches?: boolean
  branchIndex?: number
  branchCount?: number
  selectionMode?: boolean
  isSelected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  hasAnnotation: false,
  hasBranches: false,
  branchIndex: 0,
  branchCount: 1,
  selectionMode: false,
  isSelected: false
})

const emit = defineEmits<{
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'add-tag-to-message': [messageId: string]
  'add-comment-to-message': [messageId: string]
  'copy-message': [messageId: string]
  'prev-branch': []
  'next-branch': []
}>()

const contentEl = ref<HTMLElement>()
const showActions = ref(false)
const actionsExpanded = ref(false)
const isMobile = ref(false)

const isUser = computed(() => props.message.participant_type === 'human' && props.message.participant_name.toLowerCase().includes('user'))

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function onMessageClick() {
  if (isMobile.value) {
    actionsExpanded.value = !actionsExpanded.value
  }
}

function toggleActions() {
  actionsExpanded.value = !actionsExpanded.value
}

function onTextSelect(event: MouseEvent) {
  const selection = window.getSelection()
  if (!selection || selection.toString().length === 0) return
  
  const range = selection.getRangeAt(0)
  const text = selection.toString()
  
  // Calculate offsets relative to message content
  // Simplified: just use character count for now
  const content = contentEl.value?.textContent || ''
  const startOffset = content.indexOf(text)
  const endOffset = startOffset + text.length
  
  if (startOffset !== -1) {
    emit('text-selected', props.message.id, text, startOffset, endOffset)
  }
}

function addTag() {
  actionsExpanded.value = false
  emit('add-tag-to-message', props.message.id)
}

function addComment() {
  actionsExpanded.value = false
  emit('add-comment-to-message', props.message.id)
}

function copyMessage() {
  // Copy message content to clipboard
  const content = contentEl.value?.textContent || ''
  navigator.clipboard.writeText(content)
  emit('copy-message', props.message.id)
}

function formatTime(timestamp?: string) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.message-card {
  @apply px-4 py-3 rounded-xl border backdrop-blur-sm;
}

.prose :deep(p) {
  @apply my-2;
}

.prose :deep(code) {
  @apply bg-gray-900/50 px-1 py-0.5 rounded text-gray-300;
}

.prose :deep(pre) {
  @apply bg-gray-900/50 p-3 rounded overflow-x-auto;
}

.prose :deep(ul), .prose :deep(ol) {
  @apply my-2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

