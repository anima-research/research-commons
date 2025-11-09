<template>
  <div 
    class="message-row relative"
    :class="{ 'selection-mode': selectionMode, 'has-annotation': hasAnnotation }"
    :data-message-id="message.id"
    @click="onMessageClick"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
    <!-- Annotation indicators (dotted lines on right edge) -->
    <div v-if="hasAnnotation" class="absolute right-0 top-0 bottom-0 w-8 pointer-events-none">
      <!-- Top indicator line -->
      <svg class="absolute top-0 right-0 w-8 h-0.5">
        <line
          x1="0" y1="0"
          x2="32" y2="0"
          stroke="#9CA3AF"
          stroke-width="1.5"
          stroke-dasharray="4 2"
        />
      </svg>
      
      <!-- Bottom indicator line -->
      <svg class="absolute bottom-0 right-0 w-8 h-0.5">
        <line
          x1="0" y1="0"
          x2="32" y2="0"
          stroke="#9CA3AF"
          stroke-width="1.5"
          stroke-dasharray="4 2"
        />
      </svg>
    </div>

    <!-- Checkbox column (appears in selection mode) -->
    <div v-if="selectionMode" class="checkbox-column absolute left-0 top-4 w-10 flex items-center justify-center">
      <input
        type="checkbox"
        :checked="isSelected"
        @change="$emit('toggle-select', message.id)"
        @click.stop
        class="w-5 h-5 cursor-pointer"
      />
    </div>

    <div class="flex gap-4 w-full" :class="{ 'ml-10': selectionMode }">
      <!-- Avatar -->
      <Avatar 
        :participant="{
          name: message.participant_name,
          type: message.participant_type
        }"
      />

      <!-- Message content -->
      <div class="message-content flex-1 min-w-0 relative">
        <!-- Header -->
        <div class="flex items-baseline gap-2 mb-1">
          <span class="font-semibold text-gray-900 dark:text-gray-100">{{ message.participant_name }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(message.timestamp) }}</span>
          
          <!-- Model badge -->
          <span v-if="message.model_info" class="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
            {{ message.model_info.model_id }}
          </span>
          
          <!-- Actions menu (desktop: hover, mobile: always visible) -->
          <button
            class="message-menu ml-auto opacity-0 hover:opacity-100 transition-opacity"
            :class="{ 'opacity-50': isMobile, 'opacity-100': showActions || actionsExpanded }"
            @click.stop="toggleActions"
          >
            ⋮
          </button>
        </div>

        <!-- Content -->
        <div 
          class="message-text text-gray-800 dark:text-gray-200 prose prose-sm max-w-none"
          @mouseup="onTextSelect"
          ref="contentEl"
        >
          <template v-for="(block, idx) in message.content_blocks" :key="idx">
            <div v-if="block.type === 'text'" v-html="renderMarkdown(block.text || '')" />
            <div v-else-if="block.type === 'thinking'" class="thinking-block bg-gray-100 dark:bg-gray-800 p-2 rounded my-2 text-sm">
              <div class="text-gray-500 mb-1">Thinking:</div>
              <div class="text-gray-700" v-html="renderMarkdown(block.thinking?.content || '')" />
            </div>
          </template>
        </div>

        <!-- Branch navigation (if siblings exist) -->
        <div v-if="hasBranches" class="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
          <button @click="$emit('prev-branch')" class="hover:text-gray-700">⏮️</button>
          <span>{{ branchIndex + 1 }} / {{ branchCount }}</span>
          <button @click="$emit('next-branch')" class="hover:text-gray-700">⏭️</button>
        </div>

        <!-- Action bar (overlay on hover, not inline) -->
        <transition name="fade">
          <div 
            v-if="showActions || actionsExpanded"
            class="message-actions absolute right-0 bottom-2 flex gap-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-300 dark:border-gray-700 px-2 py-1.5"
          >
            <button 
              @click="annotateMessage" 
              class="px-3 py-1 text-xs hover:bg-indigo-50 rounded flex items-center gap-1 text-indigo-700"
              title="Create annotation for this message"
            >
              📌 Annotate
            </button>
            <div class="w-px bg-gray-200" />
            <button 
              @click="startMultiSelect" 
              class="px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 rounded flex items-center gap-1"
              title="Select multiple messages"
            >
              ☑️ Multi-select
            </button>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Avatar from './Avatar.vue'
import type { Message } from '@/types'
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  message: Message
  selectionMode?: boolean
  isSelected?: boolean
  hasAnnotation?: boolean
  hasBranches?: boolean
  branchIndex?: number
  branchCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectionMode: false,
  isSelected: false,
  hasAnnotation: false,
  hasBranches: false,
  branchIndex: 0,
  branchCount: 1
})

const emit = defineEmits<{
  'toggle-select': [messageId: string]
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'annotate-message': [messageId: string]
  'start-multi-select': [messageId: string]
  'prev-branch': []
  'next-branch': []
}>()

const contentEl = ref<HTMLElement>()
const showActions = ref(false)
const actionsExpanded = ref(false)
const isMobile = ref(false)

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

function annotateMessage() {
  actionsExpanded.value = false
  emit('annotate-message', props.message.id)
}

function startMultiSelect() {
  actionsExpanded.value = false
  emit('start-multi-select', props.message.id)
}

function formatTime(timestamp?: string) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.message-row {
  position: relative;
  transition: padding-left 0.2s ease;
}

.message-row.selection-mode {
  padding-left: 40px;
}

.message-menu {
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 4px;
  color: #9ca3af;
}

@media (min-width: 768px) {
  .message-menu {
    opacity: 0;
  }
  
  .message-row:hover .message-menu {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.message-actions {
  pointer-events: auto;
}

/* Ensure actions don't expand message height */
.message-content {
  position: relative;
}

.message-text {
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.thinking-block {
  font-family: 'Monaco', 'Courier New', monospace;
}
</style>

