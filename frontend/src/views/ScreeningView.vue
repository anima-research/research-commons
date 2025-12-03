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

    <!-- Main content area -->
    <div class="lg:ml-64">
      <!-- Header -->
      <header class="bg-gray-900/60 backdrop-blur-xl border-b border-gray-700/50 sticky top-0 z-20">
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h1 class="text-lg font-semibold text-gray-100">Review Queue</h1>
          </div>
          
          <!-- Stats badges -->
          <div class="flex items-center gap-3 text-sm">
            <div class="px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300">
              <span class="font-semibold">{{ stats.pending_count }}</span> pending
            </div>
            <div v-if="stats.approved_today > 0" class="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-300">
              <span class="font-semibold">{{ stats.approved_today }}</span> approved today
            </div>
            <div v-if="stats.rejected_today > 0" class="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full text-red-300">
              <span class="font-semibold">{{ stats.rejected_today }}</span> rejected today
            </div>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="px-6 text-center py-12 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-amber-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading submissions for review...
      </div>

      <!-- Empty State -->
      <div v-else-if="submissions.length === 0" class="px-6 text-center py-16">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div class="text-gray-400 text-lg mb-2">No pending submissions</div>
        <p class="text-gray-500 text-sm">All submissions have been reviewed. Check back later!</p>
      </div>

      <!-- Submission Cards -->
      <div v-else class="px-6 py-6 space-y-4">
        <div
          v-for="submission in submissions"
          :key="submission.id"
          class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4"
        >
          <!-- Header row -->
          <div class="flex items-start justify-between mb-3">
            <div class="flex-1 min-w-0">
              <h3 
                class="text-base font-medium text-gray-100 hover:text-amber-300 cursor-pointer truncate"
                @click="router.push(`/submissions/${submission.id}`)"
              >
                {{ submission.title }}
              </h3>
              <div class="flex items-center gap-2 mt-1 text-sm text-gray-400">
                <span>by {{ (submission as any).submitter_name || 'Unknown' }}</span>
                <span class="text-gray-600">•</span>
                <span>{{ formatDate(submission.submitted_at) }}</span>
                <span class="text-gray-600">•</span>
                <span class="px-1.5 py-0.5 bg-gray-700/50 rounded text-xs">{{ submission.source_type }}</span>
              </div>
            </div>
            
            <!-- Quick actions -->
            <div class="flex items-center gap-2 ml-4">
              <button
                @click="router.push(`/submissions/${submission.id}`)"
                class="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
              >
                View
              </button>
            </div>
          </div>
          
          <!-- Description preview -->
          <div v-if="(submission.metadata as any)?.description" class="mb-3 text-sm text-gray-400 line-clamp-2">
            {{ (submission.metadata as any).description }}
          </div>
          
          <!-- Topic tags -->
          <div v-if="submission.metadata.tags?.length" class="flex flex-wrap gap-1 mb-4">
            <span
              v-for="tag in submission.metadata.tags"
              :key="tag"
              class="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs rounded"
            >
              #{{ tag }}
            </span>
          </div>
          
          <!-- Auto-imported indicator -->
          <div v-if="submission.metadata.screening?.auto_imported" class="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
            </svg>
            Auto-imported from {{ submission.metadata.screening.import_source || 'crawler' }}
          </div>
          
          <!-- Action buttons -->
          <div class="flex items-center gap-3 pt-3 border-t border-gray-700/50">
            <div class="flex-1 flex items-center gap-2">
              <span class="text-xs text-gray-500">Approve as:</span>
              <button
                @click="approveSubmission(submission.id, 'public')"
                :disabled="processing === submission.id"
                class="px-3 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-300 rounded transition-colors disabled:opacity-50"
              >
                🌐 Public
              </button>
              <button
                @click="approveSubmission(submission.id, 'researcher')"
                :disabled="processing === submission.id"
                class="px-3 py-1.5 text-xs bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded transition-colors disabled:opacity-50"
              >
                📚 Researcher
              </button>
              <button
                @click="approveSubmission(submission.id, 'admin-only')"
                :disabled="processing === submission.id"
                class="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded transition-colors disabled:opacity-50"
              >
                🔒 Admin
              </button>
            </div>
            
            <button
              @click="showRejectModal(submission)"
              :disabled="processing === submission.id"
              class="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-red-500/20 border border-gray-600/50 hover:border-red-500/30 text-gray-400 hover:text-red-300 rounded transition-colors disabled:opacity-50"
            >
              ✕ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Reject Modal -->
    <div
      v-if="rejectingSubmission"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="rejectingSubmission = null"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-100 mb-2">Reject Submission</h3>
        <p class="text-sm text-gray-400 mb-4">
          Rejecting "{{ rejectingSubmission.title }}" will remove it from the queue.
        </p>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-300 mb-1">Reason (optional)</label>
          <textarea
            v-model="rejectReason"
            rows="3"
            placeholder="Why is this submission being rejected?"
            class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          />
        </div>
        
        <div class="flex gap-3">
          <button
            @click="rejectingSubmission = null; rejectReason = ''"
            class="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            @click="confirmReject"
            :disabled="processing === rejectingSubmission.id"
            class="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded transition-colors disabled:opacity-50"
          >
            {{ processing === rejectingSubmission.id ? 'Rejecting...' : 'Reject' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { screeningAPI } from '@/services/api'
import type { Submission, VisibilityLevel } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const processing = ref<string | null>(null)

const submissions = ref<Submission[]>([])
const stats = ref({ pending_count: 0, approved_today: 0, rejected_today: 0 })

// Reject modal state
const rejectingSubmission = ref<Submission | null>(null)
const rejectReason = ref('')

onMounted(() => {
  window.addEventListener('resize', checkMobile)
  loadData()
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadData() {
  loading.value = true
  try {
    const [pendingRes, statsRes] = await Promise.all([
      screeningAPI.getPending(),
      screeningAPI.getStats()
    ])
    
    submissions.value = pendingRes.data.submissions
    stats.value = statsRes.data
  } catch (error) {
    console.error('Failed to load screening data:', error)
  } finally {
    loading.value = false
  }
}

async function approveSubmission(id: string, visibility: VisibilityLevel) {
  processing.value = id
  try {
    await screeningAPI.approve(id, visibility)
    
    // Remove from list and update stats
    submissions.value = submissions.value.filter(s => s.id !== id)
    stats.value.pending_count = Math.max(0, stats.value.pending_count - 1)
    stats.value.approved_today++
    
    console.log(`[Screening] Approved ${id} as ${visibility}`)
  } catch (error) {
    console.error('Failed to approve submission:', error)
    alert('Failed to approve submission. Please try again.')
  } finally {
    processing.value = null
  }
}

function showRejectModal(submission: Submission) {
  rejectingSubmission.value = submission
  rejectReason.value = ''
}

async function confirmReject() {
  if (!rejectingSubmission.value) return
  
  const id = rejectingSubmission.value.id
  processing.value = id
  
  try {
    await screeningAPI.reject(id, rejectReason.value || undefined)
    
    // Remove from list and update stats
    submissions.value = submissions.value.filter(s => s.id !== id)
    stats.value.pending_count = Math.max(0, stats.value.pending_count - 1)
    stats.value.rejected_today++
    
    rejectingSubmission.value = null
    rejectReason.value = ''
    
    console.log(`[Screening] Rejected ${id}`)
  } catch (error) {
    console.error('Failed to reject submission:', error)
    alert('Failed to reject submission. Please try again.')
  } finally {
    processing.value = null
  }
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

