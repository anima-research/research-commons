<template>
  <div 
    v-if="highlights.length > 0"
    class="fixed right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2"
  >
    <!-- Navigation panel -->
    <div class="bg-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl p-2 flex flex-col items-center gap-1">
      <!-- Header with count -->
      <div class="text-[10px] text-gray-400 px-2 py-1 border-b border-gray-700/50 w-full text-center">
        {{ currentIndex + 1 }} / {{ highlights.length }}
      </div>
      
      <!-- Messages above indicator -->
      <div class="text-[9px] text-gray-500 py-0.5 flex flex-col items-center leading-tight">
        <span class="text-indigo-400">↑ {{ highlightsAbove }}</span>
        <span class="text-gray-600 text-[8px]">{{ messagesAbove }} msgs</span>
      </div>
      
      <!-- Up button -->
      <button
        @click="navigatePrev"
        :disabled="currentIndex <= 0"
        class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        :class="currentIndex > 0 
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      
      <!-- Current highlight type indicator -->
      <div 
        class="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
        :class="currentHighlightClass"
        :title="currentHighlightTitle"
      >
        {{ currentHighlightIcon }}
      </div>
      
      <!-- Down button -->
      <button
        @click="navigateNext"
        :disabled="currentIndex >= highlights.length - 1"
        class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
        :class="currentIndex < highlights.length - 1 
          ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white' 
          : 'bg-gray-800/50 text-gray-600 cursor-not-allowed'"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      <!-- Messages below indicator -->
      <div class="text-[9px] text-gray-500 py-0.5 flex flex-col items-center leading-tight">
        <span class="text-gray-600 text-[8px]">{{ messagesBelow }} msgs</span>
        <span class="text-indigo-400">↓ {{ highlightsBelow }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

interface Highlight {
  messageId: string
  type: 'pinned' | 'starred' | 'commented' | 'tagged'
  messageIndex: number
}

interface Props {
  messages: Array<{ id: string }>
  pinnedMessageId: string | null
  messageReactions: Map<string, Array<{ user_id: string; reaction_type: string }>>
  messagesWithComments: Set<string>
  messagesWithTags: Set<string>
  headerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  headerHeight: 120
})

const emit = defineEmits<{
  'navigate-to': [messageId: string]
}>()

const activeFilters = ref<Set<string>>(new Set(['pinned', 'starred', 'commented', 'tagged']))
const currentIndex = ref(0)
const isUserNavigating = ref(false) // Prevent scroll updates during manual navigation
const currentScrollMessageIndex = ref(0) // Track which message is at the top of viewport

// Build list of all highlights
const allHighlights = computed<Highlight[]>(() => {
  const result: Highlight[] = []
  
  props.messages.forEach((msg, index) => {
    // Check if pinned
    if (props.pinnedMessageId === msg.id) {
      result.push({ messageId: msg.id, type: 'pinned', messageIndex: index })
    }
    
    // Check if starred
    const reactions = props.messageReactions.get(msg.id) || []
    if (reactions.some(r => r.reaction_type === 'star')) {
      result.push({ messageId: msg.id, type: 'starred', messageIndex: index })
    }
    
    // Check if has comments
    if (props.messagesWithComments.has(msg.id)) {
      result.push({ messageId: msg.id, type: 'commented', messageIndex: index })
    }
    
    // Check if has tags
    if (props.messagesWithTags.has(msg.id)) {
      result.push({ messageId: msg.id, type: 'tagged', messageIndex: index })
    }
  })
  
  // Sort by message index
  result.sort((a, b) => a.messageIndex - b.messageIndex)
  
  // Deduplicate - keep only one entry per message (prefer pinned > starred > commented > tagged)
  const seen = new Set<string>()
  return result.filter(h => {
    if (seen.has(h.messageId)) return false
    seen.add(h.messageId)
    return true
  })
})

// Filtered highlights based on active filters
const highlights = computed<Highlight[]>(() => {
  return allHighlights.value.filter(h => activeFilters.value.has(h.type))
})

// Current highlight info
const currentHighlight = computed(() => highlights.value[currentIndex.value])

const currentHighlightIcon = computed(() => {
  const type = currentHighlight.value?.type
  return { pinned: '📌', starred: '⭐', commented: '💬', tagged: '🏷️' }[type || 'pinned'] || '•'
})

const currentHighlightClass = computed(() => {
  const type = currentHighlight.value?.type
  return {
    pinned: 'bg-amber-500/20 text-amber-400',
    starred: 'bg-yellow-500/20 text-yellow-400',
    commented: 'bg-blue-500/20 text-blue-400',
    tagged: 'bg-purple-500/20 text-purple-400'
  }[type || 'pinned'] || 'bg-gray-800 text-gray-400'
})

const currentHighlightTitle = computed(() => {
  const type = currentHighlight.value?.type
  return { pinned: 'Pinned', starred: 'Starred', commented: 'Has comments', tagged: 'Has tags' }[type || 'pinned'] || ''
})

// Messages above/below based on current scroll position (live updates)
const messagesAbove = computed(() => {
  return currentScrollMessageIndex.value
})

const messagesBelow = computed(() => {
  return Math.max(0, props.messages.length - currentScrollMessageIndex.value - 1)
})

// Highlights above/below current position
const highlightsAbove = computed(() => {
  return highlights.value.filter((h, i) => i < currentIndex.value).length
})

const highlightsBelow = computed(() => {
  return highlights.value.filter((h, i) => i > currentIndex.value).length
})

function navigatePrev() {
  if (currentIndex.value > 0) {
    currentIndex.value--
    scrollToCurrentHighlight()
  }
}

function navigateNext() {
  if (currentIndex.value < highlights.value.length - 1) {
    currentIndex.value++
    scrollToCurrentHighlight()
  }
}

let navigationTimeout: number | null = null

function scrollToCurrentHighlight() {
  const highlight = highlights.value[currentIndex.value]
  if (highlight) {
    // Prevent scroll updates during manual navigation
    isUserNavigating.value = true
    
    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout)
    }
    
    emit('navigate-to', highlight.messageId)
    
    // Re-enable scroll tracking after animation completes
    navigationTimeout = window.setTimeout(() => {
      isUserNavigating.value = false
    }, 800)
  }
}

// Reset index when highlights change significantly
watch(highlights, (newHighlights, oldHighlights) => {
  if (currentIndex.value >= newHighlights.length) {
    currentIndex.value = Math.max(0, newHighlights.length - 1)
  }
})

// Track scroll position to update current highlight
let scrollTimeout: number | null = null

function handleScroll() {
  // Don't update during manual navigation
  if (isUserNavigating.value) return
  
  // Debounce scroll updates
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
  
  scrollTimeout = window.setTimeout(() => {
    updateCurrentFromScroll()
  }, 50)
}

function updateCurrentFromScroll() {
  const viewportTop = window.scrollY + props.headerHeight + 50 // Account for header + some padding
  const viewportCenter = viewportTop + window.innerHeight / 3 // Focus on upper third of viewport
  
  // Update current message index based on scroll position
  let currentMsgIdx = 0
  for (let i = 0; i < props.messages.length; i++) {
    const messageEl = document.querySelector(`[data-message-id="${props.messages[i].id}"]`) as HTMLElement
    if (!messageEl) continue
    
    const rect = messageEl.getBoundingClientRect()
    const messageTop = window.scrollY + rect.top
    
    if (messageTop <= viewportTop) {
      currentMsgIdx = i
    } else {
      break
    }
  }
  currentScrollMessageIndex.value = currentMsgIdx
  
  // Update current highlight index
  if (highlights.value.length === 0) return
  
  // Find the highlight closest to viewport center (or just past it)
  let closestIndex = 0
  let closestDistance = Infinity
  
  for (let i = 0; i < highlights.value.length; i++) {
    const highlight = highlights.value[i]
    const messageEl = document.querySelector(`[data-message-id="${highlight.messageId}"]`) as HTMLElement
    if (!messageEl) continue
    
    const rect = messageEl.getBoundingClientRect()
    const messageTop = window.scrollY + rect.top
    const distance = Math.abs(messageTop - viewportCenter)
    
    // Prefer highlights that are at or above the viewport center
    if (messageTop <= viewportCenter + 100) {
      if (distance < closestDistance || messageTop > (highlights.value[closestIndex]?.messageIndex || 0)) {
        closestDistance = distance
        closestIndex = i
      }
    }
  }
  
  // Only update if different
  if (currentIndex.value !== closestIndex) {
    currentIndex.value = closestIndex
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  // Initial update
  setTimeout(updateCurrentFromScroll, 500)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }
})
</script>

