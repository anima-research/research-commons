<template>
  <div class="w-full">
    <label v-if="label" :for="id" class="block text-sm font-medium text-text-primary mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    
    <input
      v-if="!multiline"
      :id="id"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    
    <textarea
      v-else
      :id="id"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :rows="rows"
      :class="inputClasses"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    
    <p v-if="hint" class="mt-1 text-xs text-text-secondary">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  id?: string
  modelValue: string | number
  type?: string
  label?: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  required?: boolean
  multiline?: boolean
  rows?: number
  error?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  multiline: false,
  rows: 3,
  error: false
})

defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const inputClasses = computed(() => {
  const base = 'w-full px-3 py-2 bg-surface-base border rounded-lg text-text-primary placeholder-text-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
  const borderColor = props.error ? 'border-red-500' : 'border-border'
  const resize = props.multiline ? 'resize-none' : ''
  
  return [base, borderColor, resize].join(' ')
})
</script>

