<template>
  <div class="message-list-container">
    <!-- Messages -->
    <div class="messages-container space-y-4">
      <template v-for="msg in messages" :key="msg.id">
        <Message
          :message="msg"
          :has-annotation="hasAnnotation(msg.id)"
          :is-pinned="pinnedMessageId === msg.id"
          :is-hidden="hiddenMessageIds.has(msg.id)"
          :can-hide-message="canModerate"
          :reactions="messageReactions.get(msg.id)"
          :current-user-id="currentUserId"
          @text-selected="onTextSelected"
          @add-tag-to-message="onAddTagToMessage"
          @add-comment-to-message="onAddCommentToMessage"
          @copy-message="onCopyMessage"
          @toggle-pin="onTogglePin"
          @toggle-hide="onToggleHide"
          @toggle-reaction="onToggleReaction"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Message from './Message.vue'
import type { Message as MessageType } from '@/types'

interface Props {
  messages: MessageType[]
  annotatedMessageIds?: Set<string>
  userNames?: Map<string, string>
  currentUserId?: string
  canModerate?: boolean
  pinnedMessageId?: string | null
  hiddenMessageIds?: Set<string>
  messageReactions?: Map<string, Array<{ user_id: string; reaction_type: string }>>
}

const props = withDefaults(defineProps<Props>(), {
  annotatedMessageIds: () => new Set(),
  userNames: () => new Map(),
  canModerate: false,
  pinnedMessageId: null,
  hiddenMessageIds: () => new Set(),
  messageReactions: () => new Map()
})

const emit = defineEmits<{
  'add-tag-to-message': [messageId: string]
  'add-comment-to-message': [messageId: string]
  'copy-message': [messageId: string]
  'toggle-pin': [messageId: string]
  'toggle-hide': [messageId: string]
  'toggle-reaction': [messageId: string, reactionType: 'star' | 'laugh' | 'sparkles']
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'add-tag': [selectionId: string]
  'add-tag-vote': [selectionId: string, tagId: string]
  'add-comment': [selectionId: string]
  'delete-selection': [selectionId: string]
  'delete-comment': [commentId: string]
  'remove-tag': [selectionId: string, tagId: string]
}>()

function getUserName(userId: string): string {
  return props.userNames?.get(userId) || 'User'
}

function hasAnnotation(messageId: string): boolean {
  return props.annotatedMessageIds.has(messageId)
}

function onTextSelected(messageId: string, text: string, start: number, end: number) {
  emit('text-selected', messageId, text, start, end)
}

function onAddTagToMessage(messageId: string) {
  emit('add-tag-to-message', messageId)
}

function onAddCommentToMessage(messageId: string) {
  emit('add-comment-to-message', messageId)
}

function onCopyMessage(messageId: string) {
  emit('copy-message', messageId)
}

function onTogglePin(messageId: string) {
  emit('toggle-pin', messageId)
}

function onToggleHide(messageId: string) {
  emit('toggle-hide', messageId)
}

function onToggleReaction(messageId: string, reactionType: 'star' | 'laugh' | 'sparkles') {
  emit('toggle-reaction', messageId, reactionType)
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

