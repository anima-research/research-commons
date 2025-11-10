<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
    :class="[
      active 
        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
      highlight && !active ? 'border border-indigo-200 dark:border-indigo-800' : ''
    ]"
  >
    <span class="text-lg">{{ icon }}</span>
    <span class="text-sm">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  icon: string
  label: string
  route: string
  active?: boolean
  highlight?: boolean
}

withDefaults(defineProps<Props>(), {
  active: false,
  highlight: false
})

defineEmits<{
  'click': []
}>()
</script>

