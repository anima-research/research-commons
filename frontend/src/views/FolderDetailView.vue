<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950">
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
      class="fixed top-4 left-4 z-30 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 lg:hidden"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
    </button>

    <!-- Main content -->
    <div class="lg:ml-64">
      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading folder...
      </div>

      <!-- Not found -->
      <div v-else-if="!folder" class="text-center py-12 text-gray-500 dark:text-gray-400">
        Folder not found or access denied.
      </div>

      <template v-else>
        <!-- Header -->
        <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 py-4 transition-colors">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button @click="router.push('/folders')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <svg class="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
              </svg>
              <div>
                <h1 class="text-lg font-bold text-gray-900 dark:text-gray-100">{{ folder.name }}</h1>
                <p v-if="folder.description" class="text-sm text-gray-500 dark:text-gray-400">{{ folder.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Visibility badge -->
              <span v-if="folder.visibility === 'private'" class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                🔒 Private
              </span>
              <span v-else-if="folder.visibility === 'shared'" class="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                👥 Shared<template v-if="folder.required_role"> ({{ folder.required_role }}s)</template>
                <template v-if="memberCount > 0"> + {{ memberCount }}</template>
              </span>
              <span v-else class="px-2 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-xs">
                🌐 Public
              </span>

              <!-- Settings (owner only) -->
              <button
                v-if="isOwner"
                @click="showSettings = !showSettings"
                class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <!-- Settings panel (collapsible) -->
        <div v-if="showSettings && isOwner" class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-4 space-y-4">
          <!-- Members section -->
          <div>
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Members</h3>
            <div class="flex flex-wrap gap-2 mb-2">
              <span
                v-for="member in members"
                :key="member.user_id"
                class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm text-gray-700 dark:text-gray-300"
              >
                {{ member.name || member.user_id.substring(0, 8) }}
                <button
                  @click="removeMember(member.user_id)"
                  class="text-gray-400 hover:text-red-500 ml-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
              <span v-if="members.length === 0" class="text-sm text-gray-400">No members yet</span>
            </div>
            <!-- Add member search -->
            <div class="relative">
              <input
                v-model="memberSearchQuery"
                @input="searchMembers"
                @focus="searchMembers(); showMemberDropdown = true"
                @blur="hideMemberDropdownDelayed"
                type="text"
                autocomplete="off"
                data-1p-ignore
                data-lpignore="true"
                placeholder="Search by name or email..."
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <div
                v-if="showMemberDropdown && memberSearchResults.length > 0"
                class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto"
              >
                <button
                  v-for="user in memberSearchResults"
                  :key="user.id"
                  @mousedown.prevent="addMember(user.id)"
                  class="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-900 dark:text-gray-100 flex justify-between items-center"
                >
                  <span>{{ user.name }}</span>
                  <span class="text-xs text-gray-400">{{ user.email }}</span>
                </button>
              </div>
              <div
                v-if="showMemberDropdown && memberSearchQuery && memberSearchResults.length === 0 && !searchingMembers"
                class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-400"
              >
                No users found
              </div>
            </div>
          </div>

          <!-- Danger zone -->
          <div class="pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              @click="deleteFolder"
              class="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            >
              Delete Folder
            </button>
          </div>
        </div>

        <!-- Submissions list -->
        <div class="p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ submissions.length }} submission{{ submissions.length !== 1 ? 's' : '' }}
            </h2>
            <button
              v-if="isOwner"
              @click="showAddSubmission = true"
              class="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              + Add Submission
            </button>
          </div>

          <!-- Empty state -->
          <div v-if="submissions.length === 0" class="text-center py-12 text-gray-400">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No submissions in this folder yet.</p>
          </div>

          <!-- Submission cards -->
          <div v-else class="space-y-3">
            <div
              v-for="submission in submissions"
              :key="submission.id"
              class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md transition-all group"
            >
              <div class="flex items-start justify-between">
                <router-link
                  :to="`/submissions/${submission.id}`"
                  class="flex-1 min-w-0"
                >
                  <h3 class="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                    {{ submission.title }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{{ submission.source_type }}</span>
                    <span v-if="submission.submitted_at">{{ formatDate(submission.submitted_at) }}</span>
                  </div>
                </router-link>

                <!-- Remove from folder (owner only) -->
                <button
                  v-if="isOwner"
                  @click="removeSubmission(submission.id)"
                  class="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 rounded transition-all"
                  title="Remove from folder"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Add Submission Modal -->
    <div
      v-if="showAddSubmission"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showAddSubmission = false"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Submission</h3>

        <!-- Search/select from existing submissions -->
        <div class="mb-4">
          <input
            v-model="submissionSearch"
            type="text"
            placeholder="Search submissions by title..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            @input="searchSubmissions"
          />
        </div>

        <!-- Results -->
        <div class="max-h-60 overflow-y-auto space-y-1 mb-4">
          <div v-if="searchingSubmissions" class="text-center py-4 text-gray-400 text-sm">Searching...</div>
          <button
            v-for="sub in availableSubmissions"
            :key="sub.id"
            @click="addSubmission(sub.id)"
            class="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{{ sub.title }}</div>
          </button>
          <div v-if="!searchingSubmissions && submissionSearch && availableSubmissions.length === 0" class="text-center py-4 text-gray-400 text-sm">
            No submissions found
          </div>
        </div>

        <button
          @click="showAddSubmission = false"
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { foldersAPI, submissionsAPI, type Folder, type FolderMember } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const props = defineProps<{ id: string }>()

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const showSettings = ref(false)
const showAddSubmission = ref(false)

const folder = ref<Folder | null>(null)
const submissions = ref<any[]>([])
const members = ref<FolderMember[]>([])
const memberCount = ref(0)

// Add member - search
const memberSearchQuery = ref('')
const memberSearchResults = ref<{ id: string; name: string; email: string }[]>([])
const showMemberDropdown = ref(false)
const searchingMembers = ref(false)
let memberSearchTimeout: ReturnType<typeof setTimeout> | null = null

// Add submission
const submissionSearch = ref('')
const searchingSubmissions = ref(false)
const availableSubmissions = ref<any[]>([])

const isOwner = computed(() => {
  return folder.value?.created_by === authStore.user?.id || authStore.hasRole('admin')
})

onMounted(async () => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 1024
  })
  await loadFolder()
})

function handleNavigate(route: string) {
  router.push(route)
}

async function loadFolder() {
  loading.value = true
  try {
    const response = await foldersAPI.get(props.id)
    folder.value = response.data.folder
    submissions.value = response.data.submissions
    members.value = response.data.members
    memberCount.value = response.data.member_count
  } catch (error: any) {
    console.error('Failed to load folder:', error)
    if (error.response?.status === 403 || error.response?.status === 404) {
      folder.value = null
    }
  } finally {
    loading.value = false
  }
}

function hideMemberDropdownDelayed() {
  setTimeout(() => { showMemberDropdown.value = false }, 200)
}

function searchMembers() {
  if (memberSearchTimeout) clearTimeout(memberSearchTimeout)
  memberSearchTimeout = setTimeout(async () => {
    searchingMembers.value = true
    try {
      const response = await foldersAPI.searchUsers(memberSearchQuery.value)
      const existingIds = new Set(members.value.map(m => m.user_id))
      memberSearchResults.value = response.data.users.filter(u => !existingIds.has(u.id))
      showMemberDropdown.value = true
    } catch {
      memberSearchResults.value = []
    } finally {
      searchingMembers.value = false
    }
  }, 250)
}

async function addMember(userId: string) {
  if (!folder.value) return
  try {
    await foldersAPI.addMember(folder.value.id, userId)
    memberSearchQuery.value = ''
    memberSearchResults.value = []
    showMemberDropdown.value = false
    await loadFolder()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to add member')
  }
}

async function removeMember(userId: string) {
  if (!folder.value) return
  if (!confirm('Remove this member from the folder?')) return
  try {
    await foldersAPI.removeMember(folder.value.id, userId)
    await loadFolder()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to remove member')
  }
}

async function searchSubmissions() {
  if (!submissionSearch.value.trim()) {
    availableSubmissions.value = []
    return
  }
  searchingSubmissions.value = true
  try {
    const response = await submissionsAPI.search(submissionSearch.value.trim())
    const existing = new Set(submissions.value.map((s: any) => s.id))
    availableSubmissions.value = response.data.submissions
      .filter((s: { id: string; title: string }) => !existing.has(s.id))
  } catch (error) {
    console.error('Failed to search submissions:', error)
  } finally {
    searchingSubmissions.value = false
  }
}

async function addSubmission(submissionId: string) {
  if (!folder.value) return
  try {
    await foldersAPI.addSubmission(folder.value.id, submissionId)
    showAddSubmission.value = false
    submissionSearch.value = ''
    availableSubmissions.value = []
    await loadFolder()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to add submission')
  }
}

async function removeSubmission(submissionId: string) {
  if (!folder.value) return
  if (!confirm('Remove this submission from the folder?')) return
  try {
    await foldersAPI.removeSubmission(folder.value.id, submissionId)
    await loadFolder()
  } catch (error: any) {
    alert(error.response?.data?.error || 'Failed to remove submission')
  }
}

async function deleteFolder() {
  if (!folder.value) return

  const msg = submissions.value.length > 0
    ? `Delete "${folder.value.name}"? This folder contains ${submissions.value.length} submission(s). Users with access only through this folder will lose visibility. Submissions themselves will NOT be deleted.`
    : `Delete "${folder.value.name}"?`

  if (!confirm(msg)) return

  try {
    await foldersAPI.delete(folder.value.id)
    router.push('/folders')
  } catch (error) {
    console.error('Failed to delete folder:', error)
    alert('Failed to delete folder')
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
