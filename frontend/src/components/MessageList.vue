<template>
  <div class="message-list-container">
    <!-- Selection Mode Toolbar (Fixed at top of viewport) -->
    <Teleport to="body">
      <transition name="slide-down">
        <div v-if="selectionMode" class="fixed top-0 left-0 right-0 bg-gray-100 border-b border-gray-300 p-3 flex items-center justify-between z-50 shadow-md">
          <span class="text-sm font-medium">
            {{ selectedMessageIds.size }} message(s) selected
          </span>
          <div class="flex gap-2">
            <button @click="exitSelectionMode" class="px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              @click="proceedToAnnotation"
              :disabled="selectedMessageIds.size === 0"
              class="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next: Add Details →
            </button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Messages -->
    <div class="messages-container space-y-4">
      <Message
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :selection-mode="selectionMode"
        :is-selected="selectedMessageIds.has(msg.id)"
        @toggle-select="toggleMessageSelection"
        @text-selected="onTextSelected"
        @start-annotation="enterAnnotationMode"
        @comment-message="onCommentMessage"
        @rate-message="onRateMessage"
      />
    </div>

    <!-- Selection Popup (after text drag) -->
    <Teleport to="body">
      <div
        v-if="showSelectionPopup"
        class="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-50"
        :style="{ left: popupPosition.x + 'px', top: popupPosition.y + 'px' }"
      >
        <button
          @click="confirmTextSelection"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
        >
          📌 Create Selection
        </button>
        <button
          @click="quickComment"
          class="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded"
        >
          💬 Quick Comment
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Message from './Message.vue'
import type { Message as MessageType } from '@/types'

interface Props {
  messages: MessageType[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'create-selection': [data: any]
  'create-comment': [messageId: string, text?: string]
  'create-rating': [messageId: string]
  'selection-mode-changed': [active: boolean]
}>()

const selectionMode = ref(false)
const selectedMessageIds = ref<Set<string>>(new Set())
const pendingSelection = ref<any>(null)
const showSelectionPopup = ref(false)
const popupPosition = ref({ x: 0, y: 0 })

function toggleMessageSelection(messageId: string) {
  if (selectedMessageIds.value.has(messageId)) {
    selectedMessageIds.value.delete(messageId)
  } else {
    selectedMessageIds.value.add(messageId)
  }
}

function onTextSelected(messageId: string, text: string, start: number, end: number, event?: MouseEvent) {
  pendingSelection.value = {
    messageId,
    text,
    startOffset: start,
    endOffset: end
  }
  
  // Show popup near cursor
  const e = event || window.event as MouseEvent
  popupPosition.value = {
    x: e.clientX + 10,
    y: e.clientY + 10
  }
  showSelectionPopup.value = true
  
  // Hide popup when clicking elsewhere
  setTimeout(() => {
    document.addEventListener('click', hidePopup, { once: true })
  }, 100)
}

function hidePopup() {
  showSelectionPopup.value = false
  pendingSelection.value = null
}

function confirmTextSelection() {
  if (!pendingSelection.value) return
  
  // Enter selection mode with this message checked
  selectedMessageIds.value = new Set([pendingSelection.value.messageId])
  selectionMode.value = true
  emit('selection-mode-changed', true)
  showSelectionPopup.value = false
}

function quickComment() {
  if (!pendingSelection.value) return
  
  // Create selection and immediately open comment
  const messageId = pendingSelection.value.messageId
  const text = pendingSelection.value.text
  
  emit('create-comment', messageId, text)
  showSelectionPopup.value = false
  pendingSelection.value = null
}

function enterAnnotationMode(messageId: string) {
  selectedMessageIds.value = new Set([messageId])
  selectionMode.value = true
  emit('selection-mode-changed', true)
}

function exitSelectionMode() {
  selectionMode.value = false
  selectedMessageIds.value.clear()
  pendingSelection.value = null
  emit('selection-mode-changed', false)
}

function proceedToAnnotation() {
  const messageIds = Array.from(selectedMessageIds.value)
  
  // Sort by order in conversation
  const sortedMessages = messageIds
    .map(id => props.messages.find(m => m.id === id))
    .filter(m => m)
    .sort((a, b) => a!.order - b!.order)
  
  const data = {
    start_message_id: sortedMessages[0]!.id,
    end_message_id: sortedMessages[sortedMessages.length - 1]!.id,
    start_offset: messageIds.length === 1 ? pendingSelection.value?.startOffset : null,
    end_offset: messageIds.length === 1 ? pendingSelection.value?.endOffset : null,
    message_count: messageIds.length,
    text: pendingSelection.value?.text || ''
  }
  
  emit('create-selection', data)
  
  // Exit selection mode
  selectionMode.value = false
  selectedMessageIds.value.clear()
  pendingSelection.value = null
  emit('selection-mode-changed', false)
}

function onCommentMessage(messageId: string) {
  emit('create-comment', messageId)
}

function onRateMessage(messageId: string) {
  emit('create-rating', messageId)
}
</script>

<style scoped>
.selection-toolbar {
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}
</style>

