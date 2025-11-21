<template>
  <div 
    class="message-wrapper mb-6 flex"
    :class="{ 
      'justify-end': isUser,
      'justify-start': !isUser 
    }"
    :data-message-id="message.id"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Message card (assistant full width, user variable) -->
    <div 
      class="message-card group relative transition-all"
      :class="{
        'bg-indigo-500/10 border-indigo-500/20': isUser && !hasReactions && !isHidden,
        'bg-indigo-500/15 border-indigo-400 border-2': isUser && hasReactions && !isHidden,
        'bg-gray-800/40 border-gray-700/40': !isUser && !hasReactions && !isHidden,
        'bg-gray-800/60 border-gray-500 border-2': !isUser && hasReactions && !isHidden,
        'bg-red-900/20 border-red-600/50 border-2': isHidden,
        'ring-2 ring-indigo-400/50': hasAnnotation && !isHidden
      }"
      :style="{ maxWidth: isUser ? (isMobile ? '95%' : '80%') : '100%' }"
    >
      <!-- Hidden badge (for researchers/admins) -->
      <div v-if="isHidden" class="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        Hidden
      </div>
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
        <div class="flex items-center gap-2 ml-auto">
          <!-- Reaction counts (always visible if reactions exist) -->
          <div v-if="hasReactions" class="flex items-center gap-1">
            <div
              v-for="reactionType in ['star', 'laugh', 'sparkles']"
              :key="reactionType"
              v-show="getReactionCount(reactionType) > 0"
              class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] transition-all"
              :class="hasUserReacted(reactionType) 
                ? 'bg-indigo-500/20 text-indigo-300' 
                : 'bg-gray-700/50 text-gray-400'"
              :title="getReactionLabel(reactionType)"
            >
              <span>{{ getReactionEmoji(reactionType) }}</span>
              <span class="font-mono">{{ getReactionCount(reactionType) }}</span>
            </div>
          </div>
          
          <span class="text-xs text-gray-600 hidden sm:inline">
            {{ formatTime(props.message.timestamp) }}
          </span>
        </div>
        
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
        class="message-text text-gray-200 leading-relaxed relative"
        @mouseup="onTextSelect"
        ref="contentEl"
      >
        <template v-for="(block, idx) in message.content_blocks" :key="idx">
          <!-- Check if this is a redacted message (block characters) -->
          <div v-if="block.type === 'text' && block.text?.includes('▓')" class="relative">
            <div class="text-gray-500 select-none font-mono" style="filter: blur(1.5px); letter-spacing: 0.05em; line-height: 1.6;">
              {{ block.text }}
            </div>
            <!-- Centered overlay caption -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="bg-gray-900/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-700/50 flex items-center gap-2">
                <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span class="text-sm text-gray-300 font-medium">Content hidden</span>
              </div>
            </div>
          </div>
          <div v-else-if="block.type === 'text'" v-html="renderMarkdown(block.text || '')" class="prose prose-invert prose-sm max-w-none" />
          <div v-else-if="block.type === 'thinking'" class="mt-3 p-3 bg-gray-900/50 border border-gray-700/50 rounded text-xs">
            <div class="text-gray-500 mb-1 uppercase tracking-wide">Thinking</div>
            <div class="text-gray-400" v-html="renderMarkdown(block.thinking?.content || '')" />
          </div>
        </template>
      </div>

      <!-- Actions bar (floats on top, appears on hover, becomes sticky at header) -->
      <div 
        v-if="showActions || actionsExpanded"
        ref="actionsBar"
        class="flex flex-col gap-1 rounded-lg shadow-xl border border-gray-700/50 px-2 py-1"
        :class="isActionsBarSticky ? 'fixed z-50 bg-gray-900' : 'absolute right-2 bg-gray-900/95 backdrop-blur-sm'"
        :style="isActionsBarSticky ? { top: '80px', left: actionsBarLeft } : { top: '-30px' }"
        data-message-actions
        @mouseenter="handleActionsBarEnter"
        @mouseleave="handleActionsBarLeave"
      >
          <!-- Row 1: Main actions -->
          <div class="flex items-center gap-1">
            <button 
              v-if="currentUserId"
              @click="addTag" 
              class="px-2 py-1 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded transition-all flex items-center gap-1.5"
              title="Add tag to message"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Tag
            </button>
            <div v-if="currentUserId" class="w-px h-4 bg-gray-700" />
            <button 
              v-if="currentUserId"
              @click="addComment" 
              class="px-2 py-1 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-all flex items-center gap-1.5"
              title="Add comment to message"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Comment
            </button>
            <div v-if="currentUserId" class="w-px h-4 bg-gray-700" />
            <button 
              @click="copyMessage"
              class="px-2 py-1 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              title="Copy message"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            <div class="w-px h-4 bg-gray-700" />
            <button 
              v-if="currentUserId"
              @click="togglePin"
              class="px-2 py-1 text-xs transition-colors"
              :class="isPinned ? 'text-amber-400 hover:text-amber-300' : 'text-gray-500 hover:text-gray-400'"
              :title="isPinned ? 'Unpin message' : 'Pin message (scroll to on open)'"
            >
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path v-if="isPinned" d="M16 12V4h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h1v8l-4.5 4.5A1 1 0 0 0 3 16v2a1 1 0 0 0 1 1h6v5l1 1 1-1v-5h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-.5-.87L16 12z" />
                <path v-else d="M16 12V4h1a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h1v8l-4.5 4.5A1 1 0 0 0 3 16v2a1 1 0 0 0 1 1h6v5l1 1 1-1v-5h6a1 1 0 0 0 1-1v-2a1 1 0 0 0-.5-.87L16 12z" fill-opacity="0.4" />
              </svg>
            </button>
            <div v-if="canHideMessage" class="w-px h-4 bg-gray-700" />
            <button 
              v-if="canHideMessage"
              @click="toggleHide"
              class="px-2 py-1 text-xs transition-colors"
              :class="isHidden ? 'text-red-400 hover:text-red-300' : 'text-gray-500 hover:text-gray-400'"
              :title="isHidden ? 'Unhide message (visible to all)' : 'Hide message (visible only to researchers)'"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path v-if="isHidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path v-if="isHidden" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </button>
          </div>
          
          <!-- Row 2: Reactions -->
          <div v-if="currentUserId" class="flex items-center gap-1 pt-1 border-t border-gray-700/50">
            <button
              v-for="reactionType in ['star', 'laugh', 'sparkles']"
              :key="reactionType"
              @click="toggleReaction(reactionType as 'star' | 'laugh' | 'sparkles')"
              class="px-2 py-1 rounded-full text-xs transition-all flex items-center gap-1"
              :class="hasUserReacted(reactionType) 
                ? 'bg-indigo-500/30 border border-indigo-500/60 text-indigo-300' 
                : 'text-gray-400 hover:bg-gray-700/50'"
              :title="getReactionLabel(reactionType)"
            >
              <span>{{ getReactionEmoji(reactionType) }}</span>
              <span v-if="getReactionCount(reactionType) > 0" class="font-mono text-[10px]">{{ getReactionCount(reactionType) }}</span>
            </button>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
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
  isPinned?: boolean
  isHidden?: boolean
  canHideMessage?: boolean
  reactions?: Array<{ user_id: string; reaction_type: string }>
  currentUserId?: string
}

const props = withDefaults(defineProps<Props>(), {
  hasAnnotation: false,
  hasBranches: false,
  branchIndex: 0,
  isPinned: false,
  isHidden: false,
  canHideMessage: false,
  branchCount: 1,
  selectionMode: false,
  isSelected: false,
  reactions: () => [],
  currentUserId: ''
})

const emit = defineEmits<{
  'text-selected': [messageId: string, text: string, start: number, end: number]
  'add-tag-to-message': [messageId: string]
  'add-comment-to-message': [messageId: string]
  'copy-message': [messageId: string]
  'toggle-pin': [messageId: string]
  'toggle-hide': [messageId: string]
  'toggle-reaction': [messageId: string, reactionType: 'star' | 'laugh' | 'sparkles']
  'prev-branch': []
  'next-branch': []
}>()

const contentEl = ref<HTMLElement>()
const actionsBar = ref<HTMLElement>()
const showActions = ref(false)
const actionsExpanded = ref(false)
const isMobile = ref(false)
const isActionsBarSticky = ref(false)
const actionsBarLeft = ref('0px') // Left position when sticky (captured from screen)
const isMouseOverMessage = ref(false)
const isMouseOverBar = ref(false)

// Check if actions bar should be sticky (hit the header)
function updateActionsBarSticky() {
  if (!actionsBar.value || !(showActions.value || actionsExpanded.value)) {
    isActionsBarSticky.value = false
    return
  }
  
  const messageCard = actionsBar.value.closest('.message-card')
  if (!messageCard) {
    isActionsBarSticky.value = false
    return
  }
  
  const cardRect = messageCard.getBoundingClientRect()
  const headerHeight = 80 // Fixed header height
  const barHeight = 60 // Approximate actions bar height
  
  // The actions bar would naturally be at cardRect.top - 30
  const naturalTop = cardRect.top - 30
  
  // Hide if message is completely scrolled past
  if (cardRect.bottom < headerHeight + barHeight) {
    showActions.value = false
    isActionsBarSticky.value = false
    return
  }
  
  // Make it sticky if:
  // 1. Natural position would be above/behind header
  // 2. Message card still has content below the sticky position
  const shouldBeSticky = naturalTop < headerHeight && cardRect.bottom > (headerHeight + barHeight + 20)
  
  // Calculate left position for fixed positioning
  if (shouldBeSticky && !isActionsBarSticky.value) {
    // Capture the bar's actual current LEFT position before making it fixed
    const barRect = actionsBar.value.getBoundingClientRect()
    
    // Use the bar's current left position directly
    const leftPosition = barRect.left
    actionsBarLeft.value = `${leftPosition}px`
  }
  
  isActionsBarSticky.value = shouldBeSticky
}

// Watch for actions bar visibility and scroll
watch([showActions, actionsExpanded], () => {
  if (showActions.value || actionsExpanded.value) {
    nextTick(updateActionsBarSticky)
  }
})

const isUser = computed(() => props.message.participant_type === 'human' && props.message.participant_name.toLowerCase().includes('user'))

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('scroll', updateActionsBarSticky, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('scroll', updateActionsBarSticky)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

function handleMouseEnter() {
  isMouseOverMessage.value = true
  showActions.value = true
  nextTick(updateActionsBarSticky)
}

function handleMouseLeave() {
  isMouseOverMessage.value = false
  
  // Use setTimeout to allow mouse to move to the bar
  setTimeout(() => {
    // Hide only if mouse is not over message AND not over bar
    if (!isMouseOverMessage.value && !isMouseOverBar.value) {
      showActions.value = false
    }
  }, 50)
}

function handleActionsBarEnter() {
  isMouseOverBar.value = true
  showActions.value = true
}

function handleActionsBarLeave() {
  isMouseOverBar.value = false
  
  // Use setTimeout to allow mouse to move back to message
  setTimeout(() => {
    // Hide only if mouse is not over message AND not over bar
    if (!isMouseOverMessage.value && !isMouseOverBar.value) {
      showActions.value = false
    }
  }, 50)
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

function togglePin() {
  actionsExpanded.value = false
  emit('toggle-pin', props.message.id)
}

function toggleHide() {
  actionsExpanded.value = false
  emit('toggle-hide', props.message.id)
}

// Reaction helpers
const hasReactions = computed(() => {
  return props.reactions && props.reactions.length > 0
})

function getReactionEmoji(reactionType: string): string {
  const emojis = {
    star: '⭐',
    laugh: '😄',
    sparkles: '✨'
  }
  return emojis[reactionType as keyof typeof emojis] || ''
}

function getReactionCount(reactionType: string): number {
  return props.reactions?.filter(r => r.reaction_type === reactionType).length || 0
}

function hasUserReacted(reactionType: string): boolean {
  if (!props.currentUserId) return false
  return props.reactions?.some(r => r.reaction_type === reactionType && r.user_id === props.currentUserId) || false
}

function getReactionTooltip(reactionType: string): string {
  const users = props.reactions?.filter(r => r.reaction_type === reactionType)
  if (!users || users.length === 0) {
    const labels = { star: 'interesting', laugh: 'funny', sparkles: 'beautiful' }
    return `React: ${labels[reactionType as keyof typeof labels] || reactionType}`
  }
  const emoji = getReactionEmoji(reactionType)
  return `${emoji} ${users.length}`
}

function getReactionLabel(reactionType: string): string {
  const labels = { star: 'Interesting', laugh: 'Funny', sparkles: 'Beautiful' }
  const count = getReactionCount(reactionType)
  if (count > 0) {
    return `${labels[reactionType as keyof typeof labels]} (${count})`
  }
  return labels[reactionType as keyof typeof labels] || reactionType
}

function toggleReaction(reactionType: 'star' | 'laugh' | 'sparkles') {
  emit('toggle-reaction', props.message.id, reactionType)
}

function formatTime(timestamp?: string) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
</script>

<style scoped>
.message-card {
  @apply px-4 py-3 rounded-xl border;
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

