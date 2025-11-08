<template>
  <div 
    class="message-row relative"
    :class="{ 'selection-mode': selectionMode }"
    :data-message-id="message.id"
    @click="onMessageClick"
    @mouseenter="showActions = true"
    @mouseleave="showActions = false"
  >
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
          <span class="font-semibold text-gray-900">{{ message.participant_name }}</span>
          <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
          
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
          class="message-text text-gray-800"
          @mouseup="onTextSelect"
          ref="contentEl"
        >
          <template v-for="(block, idx) in message.content_blocks" :key="idx">
            <span v-if="block.type === 'text'">{{ block.text }}</span>
            <div v-else-if="block.type === 'thinking'" class="thinking-block bg-gray-100 p-2 rounded my-2 text-sm">
              <div class="text-gray-500 mb-1">Thinking:</div>
              <div class="text-gray-700">{{ block.thinking?.content }}</div>
            </div>
          </template>
        </div>

        <!-- Branch navigation (if siblings exist) -->
        <div v-if="hasBranches" class="flex items-center gap-2 mt-2 text-sm text-gray-500">
          <button @click="$emit('prev-branch')" class="hover:text-gray-700">⏮️</button>
          <span>{{ branchIndex + 1 }} / {{ branchCount }}</span>
          <button @click="$emit('next-branch')" class="hover:text-gray-700">⏭️</button>
        </div>

        <!-- Action bar (overlay on hover, not inline) -->
        <transition name="fade">
          <div 
            v-if="showActions || actionsExpanded"
            class="message-actions absolute right-0 bottom-2 flex gap-1 bg-white rounded-lg shadow-lg border border-gray-300 px-2 py-1.5"
          >
            <button @click="startAnnotation" class="px-2 py-1 text-xs hover:bg-gray-100 rounded">
              🎯 Annotate
            </button>
            <button @click="commentOnMessage" class="px-2 py-1 text-xs hover:bg-gray-100 rounded">
              💬 Comment
            </button>
            <button @click="rateMessage" class="px-2 py-1 text-xs hover:bg-gray-100 rounded">
              ⭐ Rate
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

interface Props {
  message: Message
  selectionMode?: boolean
  isSelected?: boolean
  hasBranches?: boolean
  branchIndex?: number
  branchCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectionMode: false,
  isSelected: false,
  hasBranches: false,
  branchIndex: 0,
  branchCount: 1
})

const emit = defineEmits<{
  'toggle-select': [messageId: string]
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'start-annotation': [messageId: string]
  'comment-message': [messageId: string]
  'rate-message': [messageId: string]
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

function startAnnotation() {
  actionsExpanded.value = false
  emit('start-annotation', props.message.id)
}

function commentOnMessage() {
  actionsExpanded.value = false
  emit('comment-message', props.message.id)
}

function rateMessage() {
  actionsExpanded.value = false
  emit('rate-message', props.message.id)
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

