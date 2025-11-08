<template>
  <div id="app" class="min-h-screen">
    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  // Try to restore session from localStorage
  authStore.restoreSession()
})
</script>

