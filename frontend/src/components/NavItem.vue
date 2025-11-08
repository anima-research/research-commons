<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors"
    :class="[
      active 
        ? 'bg-indigo-50 text-indigo-700 font-medium' 
        : 'text-gray-700 hover:bg-gray-50',
      highlight && !active ? 'border border-indigo-200' : ''
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

