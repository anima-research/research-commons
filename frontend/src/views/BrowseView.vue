<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
    <!-- Left Sidebar -->
    <LeftSidebar 
      :show="showMobileSidebar"
      @navigate="handleNavigate"
      @close="showMobileSidebar = false"
    />

    <!-- Mobile hamburger -->
    <button
      v-if="isMobile"
      @click="showMobileSidebar = true"
      class="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 lg:hidden transition-colors"
    >
      <svg class="w-6 h-6 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Main content area (with left margin on desktop) -->
    <div class="lg:ml-64">
      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 transition-colors">
        <div class="px-4 py-4 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">💬 Conversations</h1>
          <router-link 
            v-if="authStore.isAuthenticated()"
            to="/submit" 
            class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold text-sm shadow-md transition-all hover:scale-105"
          >
            ✨ New Conversation
          </router-link>
        </div>
      </header>

      <!-- Filters -->
      <div class="px-4 py-4">
        <div class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-6 transition-colors">
          <div class="flex flex-wrap gap-4">
          <select class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-colors">
            <option>All Topics</option>
            <option>Deprecation Attitudes</option>
            <option>Restriction Responses</option>
          </select>
          
          <label class="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 dark:border-gray-700" />
            <span class="text-sm">ARC Certified Only</span>
          </label>
          
          <div class="flex-1 flex gap-2">
            <input
              v-model="searchQuery"
              @keyup.enter="search"
              type="text"
              placeholder="Search conversations..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
            <button @click="search" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors">
              🔍
            </button>
          </div>
        </div>
      </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading conversations...
        </div>

        <!-- Conversation Cards -->
        <div v-else class="space-y-4">
          <div
            v-for="submission in submissions"
            :key="submission.id"
            @click="router.push(`/submissions/${submission.id}`)"
            class="bg-white dark:bg-gray-900 rounded-lg shadow-sm hover:shadow-md dark:hover:shadow-indigo-900/20 border border-gray-200 dark:border-gray-800 transition-all cursor-pointer p-6"
          >
          <!-- Header with avatars -->
          <div class="flex items-start gap-3 mb-3">
            <div class="flex -space-x-2">
              <div class="w-10 h-10 rounded-full bg-blue-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-semibold">
                R
              </div>
              <div class="w-10 h-10 rounded-full bg-purple-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white font-semibold">
                C
              </div>
            </div>
            
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ submission.title }}
              </h3>
              <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {{ submission.metadata.participants_summary?.join(' → ') || 'Multiple participants' }}
              </div>
            </div>
            
            <span 
              v-if="submission.source_type === 'arc-certified'"
              class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded font-medium"
            >
              ✓ ARC Certified
            </span>
            <span 
              v-else
              class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
            >
              ⬆ Upload
            </span>
          </div>

          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
            <span>{{ formatDate(submission.submitted_at) }}</span>
            <span v-if="submission.metadata.message_count">💬 {{ submission.metadata.message_count }} messages</span>
          </div>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in submission.metadata.tags"
                :key="tag"
                class="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="submissions.length === 0" class="text-center py-12 text-gray-500 dark:text-gray-400">
            No conversations yet. Be the first to contribute!
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { submissionsAPI } from '@/services/api'
import type { Submission } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)

onMounted(() => {
  window.addEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

const searchQuery = ref('')
const submissions = ref<Submission[]>([])
const loading = ref(false)

onMounted(async () => {
  await loadSubmissions()
})

async function loadSubmissions() {
  loading.value = true
  try {
    const response = await submissionsAPI.list()
    submissions.value = response.data.submissions
    console.log('Loaded submissions:', response.data.submissions.length)
  } catch (error) {
    console.error('Failed to load submissions:', error)
  } finally {
    loading.value = false
  }
}

function search() {
  console.log('Search:', searchQuery.value)
  // TODO: Implement search
}

function formatDate(date: string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (hours < 48) return 'Yesterday'
  
  return d.toLocaleDateString()
}

// Mock comment/rating counts (will fetch from API later)
const mockComments = 0
const mockRating = 0
const mockRatingCount = 0
</script>

