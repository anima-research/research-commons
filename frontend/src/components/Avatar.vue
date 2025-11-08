<template>
  <div 
    class="message-avatar flex items-center justify-center font-semibold text-white"
    :style="{ backgroundColor: avatarColor }"
    :title="participant.name"
  >
    <span v-if="!avatarImage" class="text-lg">{{ initial }}</span>
    <img v-else :src="avatarImage" :alt="participant.name" class="w-full h-full object-cover rounded-full" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  participant: {
    name: string
    type: 'human' | 'model' | 'system'
  }
}

const props = defineProps<Props>()

const initial = computed(() => props.participant.name.charAt(0).toUpperCase())

// Generate color from name hash
const avatarColor = computed(() => {
  const name = props.participant.name.toLowerCase()
  
  // Known models
  if (name.includes('claude') || name.includes('opus') || name.includes('sonnet')) {
    return '#8b5cf6' // Purple
  }
  if (name.includes('gpt') || name.includes('openai')) {
    return '#10b981' // Green
  }
  if (name.includes('gemini')) {
    return '#3b82f6' // Blue
  }
  
  // Generate color from name
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 60%, 50%)`
})

// Avatar image (null for now, can fetch from API later)
const avatarImage = computed(() => null)
</script>

