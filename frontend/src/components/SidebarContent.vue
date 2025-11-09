<template>
  <div class="flex-1 flex flex-col overflow-y-auto">
    <!-- Logo/Header -->
    <div class="p-4 border-b border-gray-200">
      <h1 class="text-xl font-bold text-indigo-600">🧬 Research Commons</h1>
      <p class="text-xs text-gray-500 mt-1">Anima Labs</p>
    </div>

    <!-- Navigation sections -->
    <nav class="flex-1 p-4 space-y-6">
      <!-- Main -->
      <div>
        <div class="text-xs font-semibold text-gray-500 uppercase mb-2">Main</div>
        <NavItem 
          icon="📚" 
          label="Submissions" 
          route="/" 
          :active="isActive('/')"
          @click="$emit('navigate', '/')"
        />
        <NavItem 
          icon="🔬" 
          label="Research Topics" 
          route="/topics" 
          :active="isActive('/topics')"
          @click="$emit('navigate', '/topics')"
        />
      </div>

      <!-- Ontologies & Criteria -->
      <div>
        <div class="text-xs font-semibold text-gray-500 uppercase mb-2">Classification</div>
        <NavItem 
          icon="🏷️" 
          label="Annotation Ontologies" 
          route="/ontologies" 
          :active="isActive('/ontologies')"
          @click="$emit('navigate', '/ontologies')"
        />
        <NavItem 
          icon="⭐" 
          label="Ranking Systems" 
          route="/rankings" 
          :active="isActive('/rankings')"
          @click="$emit('navigate', '/rankings')"
        />
      </div>

      <!-- Actions -->
      <div>
        <div class="text-xs font-semibold text-gray-500 uppercase mb-2">Actions</div>
        <NavItem 
          icon="📤" 
          label="Submit Conversation" 
          route="/submit" 
          :active="isActive('/submit')"
          highlight
          @click="$emit('navigate', '/submit')"
        />
      </div>
    </nav>

    <!-- User section -->
    <div class="p-4 border-t border-gray-200">
      <div v-if="authStore.isAuthenticated()" class="space-y-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-semibold text-sm">
            {{ authStore.user?.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 truncate">
              {{ authStore.user?.name }}
            </div>
            <div class="text-xs text-gray-500">
              {{ authStore.user?.roles.join(', ') }}
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button 
            @click="handleRefresh" 
            class="flex-1 text-xs text-indigo-600 hover:text-indigo-700 px-2 py-1 border border-indigo-200 rounded"
            :disabled="refreshing"
          >
            {{ refreshing ? '...' : '🔄 Refresh' }}
          </button>
          <button 
            @click="authStore.logout(); $emit('navigate', '/login')" 
            class="flex-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      <router-link v-else to="/login" class="block text-sm text-indigo-600 hover:text-indigo-700">
        Login / Register
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavItem from './NavItem.vue'

const route = useRoute()
const authStore = useAuthStore()

const emit = defineEmits<{
  'navigate': [route: string]
}>()

const refreshing = ref(false)

async function handleRefresh() {
  refreshing.value = true
  const success = await authStore.refreshSession()
  refreshing.value = false
  
  if (success) {
    // Refresh current page
    window.location.reload()
  }
}

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

