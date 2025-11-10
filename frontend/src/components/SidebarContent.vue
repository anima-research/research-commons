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
          icon="💬" 
          label="Conversations" 
          route="/browse" 
          :active="isActive('/browse')"
          @click="$emit('navigate', '/browse')"
        />
        <NavItem 
          icon="🔬" 
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
        <NavItem 
          icon="🤖" 
          label="AI Models" 
          route="/models" 
          :active="isActive('/models')"
          @click="$emit('navigate', '/models')"
        />
      </div>

      <!-- Actions -->
      <div>
        <div class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">Actions</div>
        <NavItem 
          icon="✨" 
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
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
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

      <!-- Theme toggle -->
      <div class="flex items-center justify-between px-3 py-2">
        <span class="text-xs text-gray-500 dark:text-gray-400">Appearance</span>
        <ThemeToggle />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavItem from '@/components/NavItem.vue'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

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

