<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
    <!-- Refined Left Sidebar (more subtle) -->
    <LeftSidebar 
      :show="showMobileSidebar"
      @navigate="handleNavigate"
      @close="showMobileSidebar = false"
      class="border-r border-gray-200/50 dark:border-gray-800/50"
    />

    <!-- Mobile hamburger (refined) -->
    <button
      v-if="isMobile"
      @click="showMobileSidebar = true"
      class="fixed top-4 left-4 z-30 p-2.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200/50 dark:border-gray-700/50 lg:hidden transition-all hover:shadow-md"
    >
      <svg class="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Main content area -->
    <div class="lg:ml-64">
      <!-- Simplified Header -->
      <header class="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-800/50">
        <div class="px-6 py-5">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-light text-gray-900 dark:text-gray-100">Conversations</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ allSubmissions.length }} conversation{{ allSubmissions.length !== 1 ? 's' : '' }} in the commons
              </p>
            </div>
            <router-link 
              v-if="authStore.isAuthenticated()"
              to="/submit" 
              class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl font-medium text-sm shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <span class="mr-1.5">+</span> New Submission
            </router-link>
          </div>
        </div>
      </header>

      <!-- Elegant Filters -->
      <div class="px-6 py-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200/30 dark:border-gray-800/30">
        <div class="flex gap-4">
          <!-- Search with better styling -->
          <div class="flex-1 relative">
            <input
              v-model="searchQuery"
              @input="filterConversations"
              type="text"
              placeholder="Search conversations..."
              class="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <svg class="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>

          <!-- Topic filter as pills -->
          <div class="flex items-center gap-2">
            <button
              v-for="topic in topicOptions"
              :key="topic"
              @click="toggleTopic(topic)"
              :class="[
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                selectedTopic === topic
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600'
              ]"
            >
              {{ topic }}
            </button>
          </div>
        </div>

        <!-- Active filters indicator -->
        <div v-if="searchQuery || selectedTopic" class="mt-4 flex items-center gap-2 text-sm">
          <span class="text-gray-500 dark:text-gray-400">Showing:</span>
          <div class="flex gap-2">
            <span v-if="searchQuery" class="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-700 dark:text-gray-300">
              "{{ searchQuery }}"
            </span>
            <span v-if="selectedTopic" class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-700 dark:text-indigo-300">
              {{ selectedTopic }}
            </span>
          </div>
          <button 
            @click="clearFilters"
            class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Loading State (refined) -->
      <div v-if="loading" class="px-6 py-24 text-center">
        <div class="inline-flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading conversations...</span>
        </div>
      </div>

      <!-- Conversation Stream (not cards!) -->
      <div v-else class="px-6 py-6">
        <div class="max-w-4xl mx-auto space-y-6">
          <article
            v-for="submission in submissions"
            :key="submission.id"
            @click="router.push(`/submissions/${submission.id}`)"
            class="group relative bg-white dark:bg-gray-900/50 rounded-2xl p-6 shadow-sm hover:shadow-lg dark:shadow-none dark:ring-1 dark:ring-gray-800/50 dark:hover:ring-gray-700/50 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <!-- Subtle gradient accent on hover -->
            <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <!-- Content -->
            <div class="relative">
              <!-- Header with participants -->
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <!-- Dynamic participant avatars -->
                  <div class="flex -space-x-2">
                    <div 
                      v-for="(participant, idx) in (submission.metadata.participants_summary || ['Researcher', 'Claude']).slice(0, 3)"
                      :key="idx"
                      :class="[
                        'w-9 h-9 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-medium text-white',
                        idx === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-purple-500 to-purple-600'
                      ]"
                    >
                      {{ participant.charAt(0).toUpperCase() }}
                    </div>
                  </div>
                  
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {{ submission.title }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ submission.metadata.participants_summary?.join(' → ') || 'Multiple participants' }}
                    </p>
                  </div>
                </div>
                
                <!-- Certification badge (refined) -->
                <div class="flex items-center gap-2">
                  <span 
                    v-if="submission.source_type === 'arc-certified'"
                    class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-lg"
                  >
                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    ARC Certified
                  </span>
                  <span v-else class="text-xs text-gray-400 dark:text-gray-500">
                    Uploaded
                  </span>
                </div>
              </div>

              <!-- Description preview (if exists) -->
              <p v-if="submission.metadata.description" class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {{ submission.metadata.description }}
              </p>

              <!-- Meta info row -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {{ formatDate(submission.submitted_at) }}
                  </span>
                  <span v-if="submission.metadata.message_count" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {{ submission.metadata.message_count }} messages
                  </span>
                </div>

                <!-- Tags (more subtle) -->
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="tag in submission.metadata.tags?.slice(0, 3)"
                    :key="tag"
                    class="px-2.5 py-1 bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 text-xs rounded-lg"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="submission.metadata.tags?.length > 3"
                    class="px-2.5 py-1 text-gray-400 dark:text-gray-500 text-xs"
                  >
                    +{{ submission.metadata.tags.length - 3 }}
                  </span>
                </div>
              </div>
            </div>
          </article>

          <!-- Empty state (friendlier) -->
          <div v-if="submissions.length === 0" class="text-center py-24">
            <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
              </svg>
            </div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
              {{ searchQuery || selectedTopic ? 'No matching conversations' : 'No conversations yet' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {{ searchQuery || selectedTopic ? 'Try adjusting your filters' : 'Be the first to contribute a conversation' }}
            </p>
            <router-link
              v-if="authStore.isAuthenticated() && !searchQuery && !selectedTopic"
              to="/submit"
              class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Conversation
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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

// Compute limited topic options for pills
const topicOptions = computed(() => {
  const topics = ['All Topics', ...availableTopics.value.slice(0, 4)]
  if (availableTopics.value.length > 4) {
    topics.push('More...')
  }
  return topics
})

function toggleTopic(topic: string) {
  if (topic === 'All Topics') {
    selectedTopic.value = ''
  } else if (topic === 'More...') {
    // Could open a modal or dropdown with all topics
    // For now, just cycle through
    selectedTopic.value = ''
  } else {
    selectedTopic.value = selectedTopic.value === topic ? '' : topic
  }
  filterConversations()
}

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
      if (sub.metadata.description?.toLowerCase().includes(query)) return true
      
      // Search in participants
      if (sub.metadata.participants_summary?.some(p => p.toLowerCase().includes(query))) return true
      
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
  if (hours < 24) return `${hours}h ago`
  if (hours < 48) return 'Yesterday'
  
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
/* Add line clamp utility for description preview */
.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

/* Smooth hover transitions */
article {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Subtle animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

article {
  animation: fadeIn 0.3s ease-out;
}
</style>




