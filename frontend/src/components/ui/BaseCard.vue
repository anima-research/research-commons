<template>
  <div :class="cardClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'elevated' | 'outlined' | 'flat'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'elevated',
  padding: 'md',
  hoverable: false
})

const cardClasses = computed(() => {
  const base = 'bg-surface-elevated rounded-lg transition-all'
  
  const variants = {
    elevated: 'shadow-md',
    outlined: 'border border-border',
    flat: ''
  }
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8'
  }
  
  const hover = props.hoverable ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer' : ''
  
  return [base, variants[props.variant], paddings[props.padding], hover].join(' ')
})
</script>

