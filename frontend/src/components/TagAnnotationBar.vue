<template>
  <div 
    ref="rootEl"
    class="tag-annotation-bar rounded-full px-3 py-1.5 flex items-center gap-2 transition-all relative group"
    :style="{ 
      backgroundColor: tagColor + '20',
      borderColor: tagColor + '40',
      borderWidth: '1px',
      borderStyle: 'solid'
    }"
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
  >
    <!-- Tooltip -->
    <div
      v-if="showTooltip && voteCount > 0"
      class="absolute top-full mt-1 left-0 z-50 pointer-events-none whitespace-nowrap"
    >
      <div class="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg">
        {{ voteTooltip }}
      </div>
    </div>
    <!-- Tag name -->
    <span class="text-sm font-medium" :style="{ color: tagColor }">
      {{ tag.name }}
    </span>
    
    <!-- Vote count -->
    <span 
      v-if="voteCount > 1" 
      class="text-xs font-mono opacity-70"
      :style="{ color: tagColor }"
    >
      ×{{ voteCount }}
    </span>
    
    <!-- User voted indicator -->
    <span 
      v-if="userHasVoted" 
      class="text-xs opacity-60"
      :style="{ color: tagColor }"
    >
      (voted)
    </span>
    
    <!-- Vote button -->
    <button
      v-if="!userHasVoted"
      @click="$emit('add-vote')"
      class="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity"
      :style="{ color: tagColor }"
      title="Add your vote"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
    
    <!-- Remove vote button -->
    <button
      v-if="userHasVoted"
      @click="$emit('remove-vote')"
      class="ml-auto text-xs opacity-60 hover:opacity-100 transition-opacity"
      :style="{ color: tagColor }"
      title="Remove your vote"
    >
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

interface Props {
  tag: {
    id: string
    name: string
    color?: string
  }
  tagAttributions: Array<{
    tag_id: string
    tagged_by: string
    tagged_at: Date
  }>
  userNames: Map<string, string>
  currentUserId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'add-vote': []
  'remove-vote': []
  'resize': [height: number]
}>()

const rootEl = ref<HTMLElement>()
const showTooltip = ref(false)

// Tag color (use tag color or generate from name)
const tagColor = computed(() => {
  if (props.tag.color) return props.tag.color
  
  // Generate color from tag name
  let hash = 0
  for (let i = 0; i < props.tag.name.length; i++) {
    hash = props.tag.name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 60%)`
})

// Vote count for this tag
const voteCount = computed(() => {
  return props.tagAttributions.filter(a => a.tag_id === props.tag.id).length
})

// Check if current user has voted
const userHasVoted = computed(() => {
  if (!props.currentUserId) return false
  return props.tagAttributions.some(a => 
    a.tag_id === props.tag.id && a.tagged_by === props.currentUserId
  )
})

// Tooltip showing who voted
const voteTooltip = computed(() => {
  const voters = props.tagAttributions
    .filter(a => a.tag_id === props.tag.id)
    .map(a => props.userNames.get(a.tagged_by) || 'Unknown')
  
  if (voters.length === 0) return 'No votes'
  if (voters.length === 1) return `Tagged by: ${voters[0]}`
  return `Tagged by: ${voters.join(', ')}`
})

// Report height changes
const reportHeight = () => {
  if (rootEl.value) {
    emit('resize', rootEl.value.offsetHeight)
  }
}

onMounted(() => {
  nextTick(reportHeight)
})

watch(() => [props.tag, props.tagAttributions.length], () => {
  nextTick(reportHeight)
})
</script>

