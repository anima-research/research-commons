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
      <div class="px-6 py-3">
        <div class="flex gap-2 flex-wrap items-center">
          <!-- Model filter -->
          <SearchableMultiSelect
            v-model="selectedModels"
            :options="availableModels"
            placeholder="All Models"
            label="models"
            @update:model-value="filterConversations"
          />

          <!-- Topic filter -->
          <SearchableMultiSelect
            v-model="selectedTopics"
            :options="availableTopics"
            placeholder="All Topics"
            label="topics"
            @update:model-value="filterConversations"
          />

          <!-- User filter -->
          <SearchableMultiSelect
            v-model="selectedUsers"
            :options="availableUsers"
            placeholder="All Authors"
            label="authors"
            @update:model-value="filterConversations"
          />

          <!-- Search -->
          <div class="flex-1 relative min-w-[150px]">
            <svg class="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              @input="filterConversations"
              type="text"
              placeholder="Search..."
              class="w-full pl-8 pr-3 py-1.5 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-200 text-xs placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <button 
            v-if="hasActiveFilters"
            @click="clearFilters"
            class="px-2 py-1.5 border border-gray-700/50 text-gray-400 rounded-lg hover:bg-gray-800/50 hover:text-gray-200 transition-all flex items-center gap-1 text-xs"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div v-else class="px-6 pb-8 space-y-1">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          @click="router.push(`/submissions/${submission.id}`)"
          class="group bg-gray-800/40 backdrop-blur-sm rounded border border-gray-700/50 hover:border-indigo-500/30 hover:bg-gray-800/60 transition-all cursor-pointer px-3 py-2"
        >
          <!-- Two-row dense layout -->
          <!-- Row 1: Title + Models + Stats -->
          <div class="flex items-center gap-2">
            <!-- Title -->
            <h3 class="text-sm font-medium text-gray-100 group-hover:text-indigo-300 transition-colors truncate flex-1 min-w-0">
              {{ submission.title }}
            </h3>
            
            <!-- Models (prominent, clickable, with message counts) -->
            <div class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
              <button
                v-for="item in getTopModelsWithCounts(submission)"
                :key="item.model"
                @click.stop="filterByModel(item.model)"
                class="px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/25 text-cyan-300 text-[11px] rounded hover:bg-cyan-500/25 transition-all font-mono whitespace-nowrap flex items-center gap-1"
                :title="item.model"
              >
                {{ formatModelPill(item.model) }}
                <span class="text-cyan-400/60 text-[9px]">{{ item.count }}</span>
              </button>
              <span v-if="(submission.metadata.model_summary?.length || 0) > 2" class="text-[10px] text-gray-500">
                +{{ (submission.metadata.model_summary?.length || 0) - 2 }}
              </span>
            </div>
            
            <!-- Stats pills -->
            <div class="flex items-center gap-1 shrink-0">
              <div v-if="(submission.metadata as any).message_count" class="px-1 py-0.5 bg-gray-700/50 text-gray-400 text-[9px] rounded font-mono" :title="'Messages'">
                {{ (submission.metadata as any).message_count }}
              </div>
              <div v-if="(submission as any).stats?.comment_count" class="px-1 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] rounded font-mono" :title="'Comments'">
                💬{{ (submission as any).stats.comment_count }}
              </div>
              <span 
                v-if="submission.source_type === 'arc-certified'"
                class="px-1 py-0.5 bg-green-500/20 text-green-400 text-[9px] rounded font-medium"
                title="ARC Certified"
              >✓</span>
            </div>
            
            <!-- Date -->
            <span class="text-[10px] text-gray-500 shrink-0 hidden sm:inline">{{ formatDate(submission.submitted_at) }}</span>
          </div>
          
          <!-- Row 2: Author + Description + Tags -->
          <div class="flex items-center gap-2 mt-1">
            <!-- Author -->
            <span class="text-[10px] text-gray-500 shrink-0">
              by {{ (submission as any).submitter_name || 'Unknown' }}
            </span>
            
            <!-- Description preview -->
            <p v-if="(submission.metadata as any).description" class="text-[11px] text-gray-500 truncate flex-1 min-w-0">
              — {{ truncateDescription((submission.metadata as any).description) }}
            </p>
            <div v-else class="flex-1"></div>
            
            <!-- Topic tags -->
            <div class="flex items-center gap-1 shrink-0">
              <button
                v-for="tagId in submission.metadata.tags?.slice(0, 1)"
                :key="tagId"
                @click.stop="filterByTopic(tagId)"
                class="px-1.5 py-0.5 bg-indigo-500/15 text-indigo-300 text-[10px] rounded hover:bg-indigo-500/25 transition-all whitespace-nowrap"
              >
                #{{ getTopicName(tagId) }}
              </button>
              <span v-if="(submission.metadata.tags?.length || 0) > 1" class="text-[9px] text-gray-500">
                +{{ (submission.metadata.tags?.length || 0) - 1 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="submissions.length === 0" class="text-center py-16">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <div v-if="hasActiveFilters" class="text-gray-500">
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { submissionsAPI, researchAPI } from '@/services/api'
import type { Submission } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'
import SearchableMultiSelect from '@/components/SearchableMultiSelect.vue'

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
const selectedTopics = ref<string[]>([])
const selectedModels = ref<string[]>([])
const selectedUsers = ref<string[]>([])
const submissions = ref<Submission[]>([])
const allSubmissions = ref<Submission[]>([])
const availableTopics = ref<Array<{ value: string; label: string }>>([])
const availableModels = ref<Array<{ value: string; label: string; badge?: string }>>([])
const availableUsers = ref<Array<{ value: string; label: string; badge?: string }>>([])
const topicMap = ref<Map<string, string>>(new Map()) // id -> name
const loading = ref(false)

onMounted(async () => {
  await loadSubmissions()
})

async function loadSubmissions() {
  loading.value = true
  try {
    // Load topics first to build the name map
    try {
      const topicsResponse = await researchAPI.getTopics()
      topicMap.value = new Map(topicsResponse.data.topics.map(t => [t.id, t.name]))
      availableTopics.value = topicsResponse.data.topics.map(t => ({ value: t.id, label: t.name }))
    } catch (e) {
      console.error('Failed to load topics:', e)
    }
    
    const response = await submissionsAPI.list()
    allSubmissions.value = response.data.submissions
    submissions.value = response.data.submissions
    
    // Extract unique models with counts
    const modelCounts = new Map<string, number>()
    const userCounts = new Map<string, { name: string; count: number }>()
    
    response.data.submissions.forEach(sub => {
      // Count models
      sub.metadata.model_summary?.forEach(model => {
        modelCounts.set(model, (modelCounts.get(model) || 0) + 1)
      })
      
      // Count users
      const userId = sub.submitter_id
      const userName = (sub as any).submitter_name || 'Unknown'
      const existing = userCounts.get(userId)
      if (existing) {
        existing.count++
      } else {
        userCounts.set(userId, { name: userName, count: 1 })
      }
    })
    
    // Build model options sorted by count
    availableModels.value = [...modelCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([model, count]) => ({ value: model, label: model, badge: String(count) }))
    
    // Build user options sorted by count (up to 15)
    availableUsers.value = [...userCounts.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([id, data]) => ({ value: id, label: data.name, badge: String(data.count) }))
    
    console.log('Loaded conversations:', response.data.submissions.length)
  } catch (error) {
    console.error('Failed to load conversations:', error)
  } finally {
    loading.value = false
  }
}

const hasActiveFilters = computed(() => 
  searchQuery.value || selectedTopics.value.length > 0 || selectedModels.value.length > 0 || selectedUsers.value.length > 0
)

function filterConversations() {
  let filtered = allSubmissions.value
  
  // Filter by models (any match)
  if (selectedModels.value.length > 0) {
    filtered = filtered.filter(sub => 
      sub.metadata.model_summary?.some(m => selectedModels.value.includes(m))
    )
  }
  
  // Filter by topics (any match)
  if (selectedTopics.value.length > 0) {
    filtered = filtered.filter(sub => 
      sub.metadata.tags?.some(t => selectedTopics.value.includes(t))
    )
  }
  
  // Filter by users (any match)
  if (selectedUsers.value.length > 0) {
    filtered = filtered.filter(sub => 
      selectedUsers.value.includes(sub.submitter_id)
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
      
      // Search in models
      if (sub.metadata.model_summary?.some(m => m.toLowerCase().includes(query))) return true
      
      // Search in author name
      if ((sub as any).submitter_name?.toLowerCase().includes(query)) return true
      
      return false
    })
  }
  
  submissions.value = filtered
}

function clearFilters() {
  searchQuery.value = ''
  selectedTopics.value = []
  selectedModels.value = []
  selectedUsers.value = []
  submissions.value = allSubmissions.value
}

function filterByModel(model: string) {
  if (!selectedModels.value.includes(model)) {
    selectedModels.value = [...selectedModels.value, model]
  }
  filterConversations()
}

function filterByTopic(topicId: string) {
  if (!selectedTopics.value.includes(topicId)) {
    selectedTopics.value = [...selectedTopics.value, topicId]
  }
  filterConversations()
}

function getTopModelsWithCounts(submission: Submission): Array<{ model: string; count: number }> {
  // Use model_counts if available (already sorted by count desc), fallback to model_summary
  const modelCounts = (submission.metadata as any).model_counts as Array<{ model: string; count: number }> | undefined
  if (modelCounts) {
    return modelCounts.slice(0, 2)
  }
  // Fallback: just return names with count 0
  return (submission.metadata.model_summary?.slice(0, 2) || []).map(m => ({ model: m, count: 0 }))
}

// Format model name for compact pill display
function formatModelPill(modelId: string): string {
  if (!modelId) return ''
  
  let name = modelId
  
  // Strip provider prefixes like google/, openai/, anthropic/
  if (name.includes('/')) {
    name = name.split('/').pop() || name
  }
  
  // Strip claude- prefix
  if (name.startsWith('claude-')) {
    name = name.replace('claude-', '')
  }
  
  // For dated models like 3-5-sonnet-20241022, show 3.5-sonnet-1022 (month-day)
  const dateMatch = name.match(/-(\d{4})(\d{2})(\d{2})$/)
  if (dateMatch) {
    const monthDay = dateMatch[2] + dateMatch[3] // e.g., "1022"
    name = name.replace(/-\d{8}$/, '-' + monthDay)
  }
  
  // For models like opus-4-5, show opus-4.5 (only when followed by non-digit or end)
  // Match: opus-4-5, sonnet-3-5, but not 3-5-sonnet
  name = name.replace(/^([a-z]+)-(\d+)-(\d+)/, '$1-$2.$3')
  
  // For models like 3-5-sonnet, show 3.5-sonnet
  name = name.replace(/^(\d+)-(\d+)-/, '$1.$2-')
  
  return name
}

function truncateDescription(desc: string): string {
  if (desc.length <= 80) return desc
  return desc.substring(0, 77) + '...'
}

function getTopicName(topicIdOrName: string): string {
  // First try to look up by ID
  const byId = topicMap.value.get(topicIdOrName)
  if (byId) return byId
  
  // Check if it's already a name (not a UUID pattern)
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidPattern.test(topicIdOrName)) {
    // It's already a name, return as-is
    return topicIdOrName
  }
  
  // Unknown UUID, show truncated
  return topicIdOrName.substring(0, 8) + '...'
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
