<template>
  <div class="message-list-container">
    <!-- Messages -->
    <div class="messages-container">
      <template v-for="(item, index) in processedMessages" :key="item.type === 'message' ? item.message.id : `hidden-group-${index}`">
        <!-- Regular message -->
        <div v-if="item.type === 'message'">
          <Message
            :message="item.message"
            :has-annotation="hasAnnotation(item.message.id)"
            :is-pinned="pinnedMessageId === item.message.id"
            :is-hidden="hiddenMessageIds.has(item.message.id)"
            :is-hidden-from-models="item.message.hidden_from_models"
            :can-hide-message="canModerate"
            :can-toggle-hidden-from-models="canToggleHiddenFromModels"
            :can-pin="canPin"
            :reactions="messageReactions.get(item.message.id)"
            :current-user-id="currentUserId"
            :participant-avatars="participantAvatars"
            :selections="messageSelections.get(item.message.id) || []"
            @text-selected="onTextSelected"
            @add-tag-to-message="onAddTagToMessage"
            @add-comment-to-message="onAddCommentToMessage"
            @copy-message="onCopyMessage"
            @toggle-pin="onTogglePin"
            @toggle-hide="onToggleHide"
            @toggle-hidden-from-models="onToggleHiddenFromModels"
            @hide-all-previous="onHideAllPrevious"
            @toggle-reaction="onToggleReaction"
            @delete-selection="onDeleteSelection"
          />
          
          <!-- Inline comments (mobile only) -->
          <div 
            v-if="getVisibleComments(item.message.id).length" 
            class="lg:hidden ml-4 mt-1 mb-3 space-y-1"
          >
            <!-- Top-level comments (limited to 2, with expand option) -->
            <template v-for="(comment, cIdx) in getVisibleComments(item.message.id)" :key="comment.id">
              <div class="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm">
                <div class="flex items-center justify-between mb-1">
                  <div class="flex items-center gap-2">
                    <svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                    </svg>
                    <span class="text-xs text-gray-400">{{ getUserName(comment.author_id) }}</span>
                    <span v-if="comment.selection_text" class="text-xs text-gray-500 truncate max-w-[100px]">
                      on "{{ comment.selection_text }}"
                    </span>
                  </div>
                  <button 
                    @click="emit('reply-to-comment', comment.id)"
                    class="text-xs text-blue-400/70 hover:text-blue-400 flex items-center gap-1"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l3 3m-3-3l3-3" />
                    </svg>
                    Reply
                  </button>
                </div>
                <div class="text-gray-200">{{ comment.content }}</div>
                
                <!-- Nested replies (show first one, collapse rest) -->
                <div v-if="comment.replies?.length" class="mt-2 ml-3 border-l-2 border-gray-700 pl-2 space-y-1">
                  <div 
                    v-for="(reply, rIdx) in getVisibleReplies(item.message.id, comment.id)" 
                    :key="reply.id"
                    class="text-sm"
                  >
                    <div class="flex items-center gap-1 text-xs text-gray-500">
                      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l3 3m-3-3l3-3" />
                      </svg>
                      {{ getUserName(reply.author_id) }}
                    </div>
                    <div class="text-gray-300 text-xs">{{ reply.content }}</div>
                  </div>
                  
                  <!-- Expand more replies button -->
                  <button 
                    v-if="getHiddenRepliesCount(item.message.id, comment.id) > 0"
                    @click="expandReplies(item.message.id, comment.id)"
                    class="text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    + {{ getHiddenRepliesCount(item.message.id, comment.id) }} more replies
                  </button>
                </div>
              </div>
            </template>
            
            <!-- Expand more comments button -->
            <button 
              v-if="getHiddenCommentsCount(item.message.id) > 0"
              @click="expandComments(item.message.id)"
              class="w-full text-xs text-indigo-400 hover:text-indigo-300 py-1"
            >
              + {{ getHiddenCommentsCount(item.message.id) }} more comments
            </button>
          </div>
        </div>
        
        <!-- Hidden messages group placeholder -->
        <div
          v-else-if="item.type === 'hidden-group'"
          class="hidden-group-placeholder mb-3 px-4 py-2 bg-red-900/20 border-2 border-red-600/50 rounded-lg text-center"
        >
          <div class="flex items-center justify-center gap-3">
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-600/30">
              <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </div>
            <div class="flex flex-col items-start">
              <span class="text-red-400 font-medium text-sm">{{ item.count }} hidden {{ item.count === 1 ? 'message' : 'messages' }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Message from './Message.vue'
import type { Message as MessageType } from '@/types'

interface InlineComment {
  id: string
  content: string
  author_id: string
  created_at: string
  selection_text?: string
  parent_id?: string
  replies?: InlineComment[]
}

interface SelectionHighlight {
  id: string
  start_offset: number
  end_offset: number
  label?: string
  hasComments?: boolean
  hasTags?: boolean
}

interface Props {
  messages: MessageType[]
  annotatedMessageIds?: Set<string>
  userNames?: Map<string, string>
  inlineComments?: Map<string, InlineComment[]> // messageId -> comments
  messageSelections?: Map<string, SelectionHighlight[]> // messageId -> selections for highlighting
  currentUserId?: string
  canModerate?: boolean
  canViewHidden?: boolean
  canToggleHiddenFromModels?: boolean
  canPin?: boolean
  pinnedMessageId?: string | null
  hiddenMessageIds?: Set<string>
  messageReactions?: Map<string, Array<{ user_id: string; reaction_type: string }>>
  participantAvatars?: Map<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  annotatedMessageIds: () => new Set(),
  userNames: () => new Map(),
  inlineComments: () => new Map(),
  messageSelections: () => new Map(),
  canModerate: false,
  canViewHidden: false,
  canToggleHiddenFromModels: false,
  canPin: false,
  pinnedMessageId: null,
  hiddenMessageIds: () => new Set(),
  messageReactions: () => new Map(),
  participantAvatars: () => new Map()
})

const emit = defineEmits<{
  'add-tag-to-message': [messageId: string]
  'add-comment-to-message': [messageId: string]
  'copy-message': [messageId: string]
  'toggle-pin': [messageId: string]
  'toggle-hide': [messageId: string]
  'toggle-hidden-from-models': [messageId: string]
  'hide-all-previous': [messageId: string]
  'toggle-reaction': [messageId: string, reactionType: 'star' | 'laugh' | 'sparkles']
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'add-tag': [selectionId: string]
  'add-tag-vote': [selectionId: string, tagId: string]
  'add-comment': [selectionId: string]
  'delete-selection': [selectionId: string]
  'delete-comment': [commentId: string]
  'remove-tag': [selectionId: string, tagId: string]
  'reply-to-comment': [commentId: string]
}>()

// Expanded state for comments and replies
const expandedComments = ref<Set<string>>(new Set()) // messageId
const expandedReplies = ref<Set<string>>(new Set()) // messageId:commentId

// Get top-level comments for a message (limited unless expanded)
function getVisibleComments(messageId: string) {
  const allComments = props.inlineComments.get(messageId) || []
  const topLevel = allComments.filter(c => !c.parent_id)
  
  if (expandedComments.value.has(messageId)) {
    return topLevel
  }
  return topLevel.slice(0, 2)
}

function getHiddenCommentsCount(messageId: string) {
  const allComments = props.inlineComments.get(messageId) || []
  const topLevel = allComments.filter(c => !c.parent_id)
  
  if (expandedComments.value.has(messageId)) {
    return 0
  }
  return Math.max(0, topLevel.length - 2)
}

function expandComments(messageId: string) {
  expandedComments.value.add(messageId)
}

// Get replies for a comment (limited unless expanded)
function getVisibleReplies(messageId: string, commentId: string) {
  const allComments = props.inlineComments.get(messageId) || []
  const comment = allComments.find(c => c.id === commentId)
  const replies = comment?.replies || []
  
  const key = `${messageId}:${commentId}`
  if (expandedReplies.value.has(key)) {
    return replies
  }
  return replies.slice(0, 1)
}

function getHiddenRepliesCount(messageId: string, commentId: string) {
  const allComments = props.inlineComments.get(messageId) || []
  const comment = allComments.find(c => c.id === commentId)
  const replies = comment?.replies || []
  
  const key = `${messageId}:${commentId}`
  if (expandedReplies.value.has(key)) {
    return 0
  }
  return Math.max(0, replies.length - 1)
}

function expandReplies(messageId: string, commentId: string) {
  expandedReplies.value.add(`${messageId}:${commentId}`)
}

// Check if user is a researcher or admin (can see individual hidden messages)
// If not, we group consecutive hidden messages
const isPrivilegedUser = computed(() => {
  // Researchers and admins can see individual hidden message badges
  // Regular users see grouped placeholders
  return props.canViewHidden
})

// Process messages to group consecutive hidden messages for non-privileged users
const processedMessages = computed(() => {
  console.log('[MessageList] Processing messages...')
  console.log('[MessageList] Total messages:', props.messages.length)
  console.log('[MessageList] Hidden message IDs:', Array.from(props.hiddenMessageIds))
  console.log('[MessageList] Annotated message IDs:', Array.from(props.annotatedMessageIds))
  console.log('[MessageList] canViewHidden:', props.canViewHidden)
  console.log('[MessageList] isPrivilegedUser:', isPrivilegedUser.value)
  
  const result: Array<
    | { type: 'message'; message: MessageType }
    | { type: 'hidden-group'; count: number; messageIds: string[] }
  > = []
  
  // If user is privileged (researcher/admin), show all messages individually
  if (isPrivilegedUser.value) {
    console.log('[MessageList] User is privileged - showing all messages individually')
    return props.messages.map(msg => ({ type: 'message' as const, message: msg }))
  }
  
  console.log('[MessageList] User is NOT privileged - grouping hidden messages')
  
  // For non-privileged users, group consecutive hidden messages
  // BUT: Messages with annotations (comments/tags) should NOT be grouped
  let currentHiddenGroup: string[] = []
  
  for (const msg of props.messages) {
    const isHidden = props.hiddenMessageIds.has(msg.id)
    const hasAnnotations = props.annotatedMessageIds.has(msg.id)
    console.log(`[MessageList] Message ${msg.id.substring(0, 8)} (order ${msg.order}): hidden=${isHidden}, annotated=${hasAnnotations}`)
    
    if (isHidden && !hasAnnotations) {
      // Hidden message WITHOUT annotations - can be grouped
      currentHiddenGroup.push(msg.id)
    } else {
      // Either not hidden, OR hidden but has annotations
      // Flush any pending hidden group first
      if (currentHiddenGroup.length > 0) {
        // Only create a group placeholder if there are 2+ messages
        if (currentHiddenGroup.length >= 2) {
          console.log('[MessageList] Flushing hidden group with', currentHiddenGroup.length, 'messages')
          result.push({
            type: 'hidden-group',
            count: currentHiddenGroup.length,
            messageIds: [...currentHiddenGroup]
          })
        } else {
          // Single hidden message without annotations - show it normally (with redacted content)
          const singleHiddenMsg = props.messages.find(m => m.id === currentHiddenGroup[0])
          if (singleHiddenMsg) {
            result.push({ type: 'message', message: singleHiddenMsg })
          }
        }
        currentHiddenGroup = []
      }
      
      // Add the current message (either visible, or hidden with annotations)
      result.push({ type: 'message', message: msg })
    }
  }
  
  // Flush any remaining hidden group
  if (currentHiddenGroup.length > 0) {
    // Only create a group placeholder if there are 2+ messages
    if (currentHiddenGroup.length >= 2) {
      console.log('[MessageList] Flushing final hidden group with', currentHiddenGroup.length, 'messages')
      result.push({
        type: 'hidden-group',
        count: currentHiddenGroup.length,
        messageIds: currentHiddenGroup
      })
    } else {
      // Single hidden message without annotations - show it normally (with redacted content)
      const singleHiddenMsg = props.messages.find(m => m.id === currentHiddenGroup[0])
      if (singleHiddenMsg) {
        result.push({ type: 'message', message: singleHiddenMsg })
      }
    }
  }
  
  console.log('[MessageList] Final processed messages:', result.length, 'items')
  console.log('[MessageList] Types:', result.map(r => r.type))
  
  return result
})

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

function onToggleHiddenFromModels(messageId: string) {
  emit('toggle-hidden-from-models', messageId)
}

function onHideAllPrevious(messageId: string) {
  emit('hide-all-previous', messageId)
}

function onToggleReaction(messageId: string, reactionType: 'star' | 'laugh' | 'sparkles') {
  emit('toggle-reaction', messageId, reactionType)
}

function onDeleteSelection(selectionId: string) {
  emit('delete-selection', selectionId)
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

