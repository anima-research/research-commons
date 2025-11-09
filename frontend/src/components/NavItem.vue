<template>
  <button
    @click="$emit('click')"
    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group"
    :class="[
      active 
        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
      highlight && !active ? 'ring-2 ring-indigo-500 ring-opacity-50' : ''
    ]"
  >
    <span class="text-xl transition-transform group-hover:scale-110">{{ icon }}</span>
    <span class="text-sm font-medium">{{ label }}</span>
    <span v-if="active" class="ml-auto">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
      </svg>
    </span>
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

