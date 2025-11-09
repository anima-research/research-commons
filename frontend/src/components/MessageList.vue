<template>
  <div class="message-list-container">
    <!-- Selection Mode Toolbar (Fixed at top of viewport) -->
    <Teleport to="body">
      <transition name="slide-down">
        <div v-if="selectionMode" class="fixed top-0 left-0 right-0 bg-indigo-600 text-white p-3 flex items-center justify-between z-50 shadow-md">
          <span class="text-sm font-medium">
            📌 {{ selectedMessageIds.size }} message(s) selected for annotation
          </span>
          <div class="flex gap-2">
            <button @click="exitSelectionMode" class="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-400">
              Cancel
            </button>
            <button 
              @click="proceedToAnnotation"
              :disabled="selectedMessageIds.size === 0"
              class="px-4 py-2 rounded bg-white text-indigo-600 font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Annotation →
            </button>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Messages -->
    <div class="messages-container space-y-4">
      <template v-for="msg in messages" :key="msg.id">
        <Message
          :message="msg"
          :selection-mode="selectionMode"
          :is-selected="selectedMessageIds.has(msg.id)"
          :has-annotation="hasAnnotation(msg.id)"
          @toggle-select="toggleMessageSelection"
          @text-selected="onTextSelected"
          @annotate-message="onAnnotateMessage"
          @start-multi-select="enterAnnotationMode"
        />
        
        <!-- Inline annotations (mobile only) -->
        <div v-if="inlineAnnotations.has(msg.id)" class="ml-12 space-y-2">
          <SelectionCard
            v-for="(annotation, idx) in inlineAnnotations.get(msg.id)"
            :key="annotation.selection.id"
            :selection="annotation.selection"
            :tags="annotation.tags"
            :comments="annotation.comments"
            :created-by="getUserName(annotation.selection.created_by)"
            :user-names="userNames"
            :current-user-id="currentUserId"
            :can-delete="canModerate || annotation.selection.created_by === currentUserId"
            :can-delete-comments="canModerate"
            @add-tag="$emit('add-tag', annotation.selection.id)"
            @add-comment="$emit('add-comment', annotation.selection.id)"
            @delete="$emit('delete-selection', annotation.selection.id)"
            @delete-comment="$emit('delete-comment', $event)"
          />
        </div>
      </template>
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
import SelectionCard from './SelectionCard.vue'
import type { Message as MessageType } from '@/types'

interface Props {
  messages: MessageType[]
  annotatedMessageIds?: Set<string>
  inlineAnnotations?: Map<string, any[]>
  userNames?: Map<string, string>
  currentUserId?: string
  canModerate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  annotatedMessageIds: () => new Set(),
  inlineAnnotations: () => new Map(),
  userNames: () => new Map(),
  canModerate: false
})

const emit = defineEmits<{
  'annotate-message': [messageId: string]
  'start-multi-select': [messageId: string]
  'selection-mode-changed': [active: boolean]
  'add-tag': [selectionId: string]
  'add-comment': [selectionId: string]
  'delete-selection': [selectionId: string]
  'delete-comment': [commentId: string]
}>()

function getUserName(userId: string): string {
  return props.userNames?.get(userId) || 'User'
}

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

function onAnnotateMessage(messageId: string) {
  // Immediately create annotation for single message
  emit('annotate-message', messageId)
}

function enterAnnotationMode(messageId: string) {
  // Enter multi-select mode
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

function hasAnnotation(messageId: string): boolean {
  return props.annotatedMessageIds.has(messageId)
}

function proceedToAnnotation() {
  const messageIds = Array.from(selectedMessageIds.value)
  
  // Sort by order in conversation
  const sortedMessages = messageIds
    .map(id => props.messages.find(m => m.id === id))
    .filter(m => m)
    .sort((a, b) => a!.order - b!.order)
  
  if (sortedMessages.length === 0) return
  
  // Create annotation for first message (or range if multiple selected)
  // For now, just emit first message - parent component will handle spanning logic
  emit('annotate-message', sortedMessages[0]!.id)
  
  // Exit selection mode
  selectionMode.value = false
  selectedMessageIds.value.clear()
  pendingSelection.value = null
  emit('selection-mode-changed', false)
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

