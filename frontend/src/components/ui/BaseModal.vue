<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
        @click.self="$emit('close')"
      >
        <div 
          :class="modalClasses"
          class="bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden flex flex-col transition-colors"
        >
          <!-- Header -->
          <div v-if="title || $slots.header" class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <slot name="header">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ title }}</h2>
            </slot>
            <button
              v-if="closable"
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none transition-colors"
            >
              ✕
            </button>
          </div>

          <!-- Content -->
          <div :class="['flex-1', scrollable ? 'overflow-y-auto' : '']">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  show: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closable?: boolean
  scrollable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  closable: true,
  scrollable: true
})

defineEmits<{
  'close': []
}>()

const modalClasses = computed(() => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw]'
  }
  
  return [
    'w-full',
    sizes[props.size],
    'max-h-[90vh]'
  ].join(' ')
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

