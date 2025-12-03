<template>
  <div class="flex-1 flex flex-col overflow-y-auto">
    <!-- Logo/Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-800">
      <router-link to="/" class="block group">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            RC
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Research Commons
            </h1>
            <p class="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Anima Labs</p>
          </div>
        </div>
      </router-link>
    </div>

    <!-- Navigation sections -->
    <nav class="flex-1 p-3 space-y-1">
      <!-- Main -->
      <div class="mb-6">
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Explore</div>
        <NavItem 
          icon-path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          label="Conversations" 
          route="/browse" 
          :active="isActive('/browse')"
          @click="$emit('navigate', '/browse')"
        />
        <NavItem 
          icon-path="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
          label="Research Topics" 
          route="/topics" 
          :active="isActive('/topics')"
          @click="$emit('navigate', '/topics')"
        />
      </div>

      <!-- Classification -->
      <div class="mb-6">
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Classification</div>
        <NavItem 
          icon-path="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
          label="Annotation Ontologies" 
          route="/ontologies" 
          :active="isActive('/ontologies')"
          @click="$emit('navigate', '/ontologies')"
        />
        <NavItem 
          icon-path="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
          label="Ranking Systems" 
          route="/rankings" 
          :active="isActive('/rankings')"
          @click="$emit('navigate', '/rankings')"
        />
        <NavItem 
          icon-path="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" 
          label="AI Models" 
          route="/models" 
          :active="isActive('/models')"
          @click="$emit('navigate', '/models')"
        />
      </div>

      <!-- Review (admin/researcher only) -->
      <div v-if="canAccessScreening" class="mb-6">
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Review</div>
        <NavItem 
          icon-path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" 
          label="Screening Queue" 
          route="/screening" 
          :active="isActive('/screening')"
          :badge="pendingCount > 0 ? pendingCount : undefined"
          @click="$emit('navigate', '/screening')"
        />
      </div>

      <!-- Actions -->
      <div>
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Actions</div>
        <NavItem 
          icon-path="M12 4v16m8-8H4" 
          label="New Conversation" 
          route="/submit" 
          :active="isActive('/submit')"
          highlight
          @click="$emit('navigate', '/submit')"
        />
      </div>
    </nav>

    <!-- User section -->
    <div class="mt-auto p-3 border-t border-gray-200 dark:border-gray-800">
      <div v-if="authStore.isAuthenticated()" class="space-y-3">
        <!-- User card -->
        <div class="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/50">
          <div class="flex items-start gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shrink-0">
              {{ authStore.user?.name.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                {{ authStore.user?.name }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-400 flex gap-1 flex-wrap">
                <span v-for="role in authStore.user?.roles" :key="role" class="px-1.5 py-0.5 bg-white dark:bg-gray-900 rounded text-[10px]">
                  {{ role }}
                </span>
              </div>
            </div>
            <button 
              @click="$emit('navigate', '/profile')"
              class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
              title="View Profile"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
          <button 
            @click="authStore.logout(); $emit('navigate', '/login')" 
            class="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 py-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      <router-link v-else to="/login" class="block px-4 py-3 text-center bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg transition-all hover:scale-105">
        Get Started
      </router-link>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { screeningAPI } from '@/services/api'
import NavItem from '@/components/NavItem.vue'

const route = useRoute()
const authStore = useAuthStore()

const emit = defineEmits<{
  'navigate': [route: string]
}>()

// Screening access check
const canAccessScreening = computed(() => {
  return authStore.hasRole('admin') || authStore.hasRole('researcher')
})

// Pending count for badge
const pendingCount = ref(0)

// Load pending count when user can access screening
async function loadPendingCount() {
  if (!canAccessScreening.value) return
  
  try {
    const response = await screeningAPI.getStats()
    pendingCount.value = response.data.pending_count
  } catch (err) {
    // Silently fail - badge just won't show
    console.error('[Sidebar] Failed to load pending count:', err)
  }
}

onMounted(() => {
  loadPendingCount()
})

// Reload when auth state changes
watch(() => authStore.user, () => {
  loadPendingCount()
})

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

