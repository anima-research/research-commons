<template>
  <div class="message-list-container">
    <!-- Messages -->
    <div class="messages-container space-y-4">
      <template v-for="msg in messages" :key="msg.id">
        <Message
          :message="msg"
          :has-annotation="hasAnnotation(msg.id)"
          @text-selected="onTextSelected"
          @add-tag-to-message="onAddTagToMessage"
          @add-comment-to-message="onAddCommentToMessage"
          @copy-message="onCopyMessage"
        />
        
        <!-- Inline annotations (mobile only) -->
        <div v-if="inlineAnnotations.has(msg.id)" class="ml-12 space-y-2">
          <SelectionCard
            v-for="(annotation, idx) in inlineAnnotations.get(msg.id)"
            :key="annotation.selection.id"
            :selection="annotation.selection"
            :tags="annotation.tags"
            :comments="annotation.comments"
            :tag-attributions="annotation.tagAttributions || []"
            :created-by="getUserName(annotation.selection.created_by)"
            :user-names="userNames"
            :current-user-id="currentUserId"
            :can-delete="canModerate || annotation.selection.created_by === currentUserId"
            :can-delete-comments="canModerate"
            :can-remove-tags="canModerate"
            @add-tag="$emit('add-tag', annotation.selection.id)"
            @add-tag-vote="$emit('add-tag-vote', annotation.selection.id, $event)"
            @add-comment="$emit('add-comment', annotation.selection.id)"
            @delete="$emit('delete-selection', annotation.selection.id)"
            @delete-comment="$emit('delete-comment', $event)"
            @remove-tag="$emit('remove-tag', annotation.selection.id, $event)"
          />
        </div>
      </template>
    </div>
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
  'add-tag-to-message': [messageId: string]
  'add-comment-to-message': [messageId: string]
  'copy-message': [messageId: string]
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

