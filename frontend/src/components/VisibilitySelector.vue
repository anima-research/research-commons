<template>
  <div class="space-y-2">
    <label v-if="showLabel" class="block text-sm font-medium text-gray-300">
      Visibility
    </label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        @click="!disabled && emit('update:modelValue', option.value)"
        :disabled="disabled"
        :class="[
          'px-3 py-1.5 rounded text-xs font-medium transition-all border',
          modelValue === option.value
            ? option.activeClass
            : 'bg-gray-800/50 border-gray-700/50 text-gray-400 hover:bg-gray-700/50 hover:text-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        ]"
        :title="option.description"
      >
        <span class="mr-1">{{ option.icon }}</span>
        {{ option.label }}
      </button>
    </div>
    <p v-if="showDescription && selectedOption" class="text-xs text-gray-500 mt-1">
      {{ selectedOption.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { VisibilityLevel } from '@/types'

interface Props {
  modelValue: VisibilityLevel
  disabled?: boolean
  showLabel?: boolean
  showDescription?: boolean
  excludePending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  showLabel: true,
  showDescription: true,
  excludePending: true
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: VisibilityLevel): void
}>()

const allOptions = [
  {
    value: 'pending' as VisibilityLevel,
    label: 'Pending',
    icon: '⏳',
    description: 'Awaiting review - only visible to admins in screening queue',
    activeClass: 'bg-amber-500/20 border-amber-500/50 text-amber-300'
  },
  {
    value: 'public' as VisibilityLevel,
    label: 'Public',
    icon: '🌐',
    description: 'Visible to everyone, including anonymous users',
    activeClass: 'bg-green-500/20 border-green-500/50 text-green-300'
  },
  {
    value: 'researcher' as VisibilityLevel,
    label: 'Researcher',
    icon: '📚',
    description: 'Visible to researchers and admins only',
    activeClass: 'bg-purple-500/20 border-purple-500/50 text-purple-300'
  },
  {
    value: 'admin-only' as VisibilityLevel,
    label: 'Admin Only',
    icon: '🔒',
    description: 'Restricted to administrators only',
    activeClass: 'bg-red-500/20 border-red-500/50 text-red-300'
  }
]

const options = computed(() => {
  if (props.excludePending) {
    return allOptions.filter(o => o.value !== 'pending')
  }
  return allOptions
})

const selectedOption = computed(() => {
  return allOptions.find(o => o.value === props.modelValue)
})
</script>

