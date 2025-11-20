<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
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
      class="fixed top-4 left-4 z-30 p-2 bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700/50 lg:hidden"
    >
      <svg class="w-6 h-6 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Main content area (with left margin on desktop) -->
    <div class="lg:ml-64">
      <!-- Header -->
      <header class="bg-gray-900/60 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-20">
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <h1 class="text-lg font-semibold text-gray-100">Conversations</h1>
          </div>
          <router-link 
            v-if="authStore.isAuthenticated()"
            to="/submit" 
            class="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold text-sm shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Conversation
          </router-link>
        </div>
      </header>

      <!-- Filters & Search -->
      <div class="px-6 py-4">
        <div class="flex gap-2">
          <!-- Topic filter -->
          <div class="relative">
            <select
              v-model="selectedTopic"
              @change="filterConversations"
              class="px-3 py-2 pr-8 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">All Topics</option>
              <option v-for="topic in availableTopics" :key="topic" :value="topic">
                {{ topic }}
              </option>
            </select>
            <svg class="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <!-- Search -->
          <div class="flex-1 relative">
            <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              @input="filterConversations"
              type="text"
              placeholder="Search conversations..."
              class="w-full pl-10 pr-4 py-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button 
            v-if="searchQuery || selectedTopic"
            @click="clearFilters"
            class="px-3 py-2 border border-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-800/50 hover:text-gray-200 transition-all flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="px-6 text-center py-12 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading conversations...
      </div>

      <!-- Conversation Cards -->
      <div v-else class="px-6 pb-8 space-y-1.5">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          @click="router.push(`/submissions/${submission.id}`)"
          class="group bg-gray-800/40 backdrop-blur-sm rounded border border-gray-700/50 hover:border-indigo-500/30 hover:bg-gray-800/60 transition-all cursor-pointer px-3 py-2"
        >
          <!-- Responsive layout: 2 rows on mobile, 1 row on desktop -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <!-- Row 1 (mobile) / Left section (desktop): Title + Metadata -->
            <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <!-- Title -->
              <h3 class="text-sm font-medium text-gray-100 group-hover:text-indigo-300 transition-colors truncate flex-1 min-w-0">
                {{ submission.title }}
              </h3>
              
              <!-- Metadata -->
              <div class="flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
                <span class="hidden sm:inline">{{ formatDate(submission.submitted_at) }}</span>
                <span class="hidden sm:inline text-gray-700">•</span>
                <span class="truncate max-w-[100px]">{{ (submission as any).submitter_name || 'Unknown' }}</span>
              </div>
            </div>
            
            <!-- Row 2 (mobile) / Right section (desktop): Model, Tags, Stats -->
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
              <!-- Model & Participants -->
              <div class="flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
                <span v-if="submission.metadata.model_summary?.length" class="truncate max-w-[120px]" :title="submission.metadata.model_summary.join(', ')">
                  {{ submission.metadata.model_summary[0] }}{{ submission.metadata.model_summary.length > 1 ? ` +${submission.metadata.model_summary.length - 1}` : '' }}
                </span>
                <span v-if="submission.metadata.participants_summary?.length" class="text-gray-600 hidden sm:inline">
                  ({{ submission.metadata.participants_summary.length }} participants)
                </span>
              </div>
              
              <!-- Topic tags (max 2 on mobile, hide on very small) -->
              <div class="hidden xs:flex items-center gap-1 shrink-0">
                <button
                  v-for="tag in submission.metadata.tags?.slice(0, 2)"
                  :key="tag"
                  class="px-1.5 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] rounded hover:bg-indigo-500/30 transition-all"
                  @click.stop
                >
                  #{{ tag }}
                </button>
                <span v-if="(submission.metadata.tags?.length || 0) > 2" class="text-[10px] text-gray-600">
                  +{{ (submission.metadata.tags?.length || 0) - 2 }}
                </span>
              </div>
              
              <!-- Stats pills -->
              <div class="flex items-center gap-1.5 shrink-0">
              <!-- Message count -->
              <div v-if="(submission.metadata as any).message_count" class="px-1.5 py-0.5 bg-gray-700/50 text-gray-400 text-[10px] rounded font-mono flex items-center gap-1">
                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                </svg>
                {{ (submission.metadata as any).message_count }}
              </div>
              
              <!-- Rating count -->
              <div v-if="(submission as any).stats?.rating_count" class="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded font-mono flex items-center gap-1">
                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {{ (submission as any).stats.rating_count }}
              </div>
              
              <!-- Tag count -->
              <div v-if="(submission as any).stats?.tag_count" class="px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] rounded font-mono flex items-center gap-1">
                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                </svg>
                {{ (submission as any).stats.tag_count }}
              </div>
              
              <!-- Comment count -->
              <div v-if="(submission as any).stats?.comment_count" class="px-1.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] rounded font-mono flex items-center gap-1">
                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
                </svg>
                {{ (submission as any).stats.comment_count }}
              </div>
              
              <!-- ARC badge -->
              <span 
                v-if="submission.source_type === 'arc-certified'"
                class="px-1.5 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] rounded flex items-center gap-0.5 font-medium"
              >
                <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                ARC
              </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="submissions.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div v-if="searchQuery || selectedTopic" class="text-gray-500">
            <p class="text-sm">No conversations match your filters</p>
            <button @click="clearFilters" class="mt-3 text-indigo-400 hover:text-indigo-300 text-sm">
              Clear filters
            </button>
          </div>
          <div v-else class="text-gray-500">
            <p class="text-sm mb-3">No conversations yet</p>
            <router-link 
              to="/submit"
              class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 rounded-lg text-sm transition-all"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create First Conversation
            </router-link>
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
const selectedTopic = ref('')
const submissions = ref<Submission[]>([])
const allSubmissions = ref<Submission[]>([])
const availableTopics = ref<string[]>([])
const loading = ref(false)

onMounted(async () => {
  await loadSubmissions()
})

async function loadSubmissions() {
  loading.value = true
  try {
    const response = await submissionsAPI.list()
    allSubmissions.value = response.data.submissions
    submissions.value = response.data.submissions
    
    // Extract unique topics
    const topicsSet = new Set<string>()
    response.data.submissions.forEach(sub => {
      sub.metadata.tags?.forEach(tag => topicsSet.add(tag))
    })
    availableTopics.value = Array.from(topicsSet).sort()
    
    console.log('Loaded conversations:', response.data.submissions.length)
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

function filterConversations() {
  let filtered = allSubmissions.value
  
  // Filter by topic
  if (selectedTopic.value) {
    filtered = filtered.filter(sub => 
      sub.metadata.tags?.includes(selectedTopic.value)
    )
  }
  
  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(sub => {
      // Search in title
      if (sub.title.toLowerCase().includes(query)) return true
      
      // Search in description
      if ((sub.metadata as any).description?.toLowerCase().includes(query)) return true
      
      return false
    })
  }
  
  submissions.value = filtered
}

function clearFilters() {
  searchQuery.value = ''
  selectedTopic.value = ''
  submissions.value = allSubmissions.value
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
</script>
