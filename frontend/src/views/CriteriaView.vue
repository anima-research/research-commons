<template>
  <div class="min-h-screen bg-gray-50">
    <LeftSidebar :show="showMobileSidebar" @navigate="handleNavigate" @close="showMobileSidebar = false" />
    
    <div class="lg:ml-64">
      <header class="bg-white border-b p-4">
        <h1 class="text-xl font-bold">⭐ Rating Criteria</h1>
      </header>
      <div class="p-8">
        <p class="text-gray-600">Criteria management UI coming soon...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const showMobileSidebar = ref(false)

function handleNavigate(route: string) {
  router.push(route)
}
</script>

