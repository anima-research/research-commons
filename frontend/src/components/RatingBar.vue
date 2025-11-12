<template>
  <div class="flex items-stretch gap-1.5 h-full" @click.stop>
    <!-- Battery container -->
    <div class="flex-1 border border-gray-600 rounded bg-gray-800/50 p-0.5 flex items-center">
      <!-- Rating segments -->
      <div class="flex items-center gap-0.5 flex-1 h-full">
        <button
          v-for="level in levels"
          :key="level"
          @click.stop="setRating(level)"
          class="h-full rounded transition-all flex-1 min-w-0"
          :class="getSegmentClass(level)"
          :title="`Rate ${level}/${max}`"
        />
      </div>
    </div>
    
    <!-- Clear button -->
    <button
      v-if="modelValue !== null"
      @click.stop="clearRating"
      class="w-5 h-full flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded transition-colors shrink-0"
      title="Clear rating"
    >
      <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: number | null
  min: number
  max: number
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

// Generate array of rating levels
const levels = computed(() => {
  const result: number[] = []
  for (let i = props.min; i <= props.max; i++) {
    result.push(i)
  }
  return result
})

// Get color class for segment based on whether it's filled
function getSegmentClass(level: number): string {
  const isActive = props.modelValue !== null && level <= props.modelValue
  
  if (!isActive) {
    return 'bg-gray-700/50 hover:bg-gray-600/50'
  }
  
  // Uniform color for all active segments
  return 'bg-indigo-500/80 hover:bg-indigo-500 border border-indigo-600/50'
}

function setRating(level: number) {
  emit('update:modelValue', level)
}

function clearRating() {
  emit('update:modelValue', null)
}
</script>

