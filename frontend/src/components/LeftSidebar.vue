<template>
  <!-- Desktop: Fixed left sidebar -->
  <div 
    v-if="!isMobile"
    class="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 transition-colors"
  >
    <SidebarContent @navigate="$emit('navigate', $event)" />
  </div>

  <!-- Mobile: Full screen overlay -->
  <Teleport to="body">
    <transition name="slide-right">
      <div
        v-if="isMobile && show"
        class="fixed inset-0 bg-white dark:bg-gray-900 z-50 flex flex-col"
      >
        <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
          <button @click="$emit('close')" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 text-2xl">
            ×
          </button>
        </div>
        <SidebarContent @navigate="handleMobileNavigate" />
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SidebarContent from './SidebarContent.vue'

interface Props {
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  'navigate': [route: string]
  'close': []
}>()

const isMobile = ref(false)

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleMobileNavigate(route: string) {
  emit('navigate', route)
  emit('close')
}
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(-100%);
}
</style>

