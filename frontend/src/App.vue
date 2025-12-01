<template>
  <div id="app" class="min-h-screen">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Try to restore session from localStorage
  authStore.restoreSession()
  // Set up listener for auth errors (expired tokens)
  authStore.setupAuthListener()
})

onUnmounted(() => {
  authStore.teardownAuthListener()
})
</script>

