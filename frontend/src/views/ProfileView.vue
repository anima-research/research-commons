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
        <div class="px-6 py-4">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h1 class="text-lg font-semibold text-gray-100">My Profile</h1>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="px-6 text-center py-12 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading profile...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="px-6 py-8">
        <div class="bg-red-900/20 border border-red-700/50 rounded-lg p-4 text-red-200">
          <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          {{ error }}
        </div>
      </div>

      <!-- Profile Content -->
      <div v-else class="px-6 pb-8">
        <!-- User Info Card -->
        <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-6 mb-6 mt-4">
          <!-- View Mode -->
          <div v-if="!isEditingProfile" class="flex items-center gap-4">
            <!-- Avatar -->
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {{ getInitials(authStore.user?.name || '') }}
            </div>
            
            <!-- User Details -->
            <div class="flex-1">
              <h2 class="text-xl font-bold text-gray-100">{{ authStore.user?.name }}</h2>
              <p class="text-sm text-gray-400">{{ authStore.user?.email }}</p>
              <div class="flex gap-2 mt-2">
                <span 
                  v-for="role in authStore.user?.roles" 
                  :key="role"
                  class="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs rounded"
                >
                  {{ role }}
                </span>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="hidden sm:flex gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-100">{{ submissions.length }}</div>
                <div class="text-xs text-gray-400">Submissions</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-gray-100">{{ comments.length }}</div>
                <div class="text-xs text-gray-400">Comments</div>
              </div>
            </div>
            
            <!-- Edit Button -->
            <button
              @click="startEditingProfile"
              class="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-100">Edit Profile</h3>
              <button
                @click="cancelEditingProfile"
                class="text-gray-400 hover:text-gray-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Error Display -->
            <div v-if="profileError" class="bg-red-900/20 border border-red-700/50 rounded-lg p-3 text-red-200 text-sm">
              {{ profileError }}
            </div>

            <!-- Success Display -->
            <div v-if="profileSuccess" class="bg-green-900/20 border border-green-700/50 rounded-lg p-3 text-green-200 text-sm">
              {{ profileSuccess }}
            </div>

            <!-- Name Field -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Name</label>
              <input
                v-model="editForm.name"
                type="text"
                class="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <!-- Email Field -->
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                v-model="editForm.email"
                type="email"
                class="w-full px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <!-- Password Change Section -->
            <div class="pt-2 border-t border-gray-700/50">
              <button
                v-if="!isEditingPassword"
                @click="startEditingPassword"
                class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Change Password
              </button>

              <!-- Password Form (expanded) -->
              <div v-else class="space-y-3 mt-3 pl-6 border-l-2 border-indigo-500/30">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-300">Change Password</span>
                  <button
                    @click="cancelEditingPassword"
                    class="text-xs text-gray-400 hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>

                <!-- Password Error -->
                <div v-if="passwordError" class="bg-red-900/20 border border-red-700/50 rounded-lg p-2 text-red-200 text-xs">
                  {{ passwordError }}
                </div>

                <!-- Password Success -->
                <div v-if="passwordSuccess" class="bg-green-900/20 border border-green-700/50 rounded-lg p-2 text-green-200 text-xs">
                  {{ passwordSuccess }}
                </div>

                <!-- Current Password -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
                  <input
                    v-model="passwordForm.currentPassword"
                    type="password"
                    class="w-full max-w-md px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter current password"
                  />
                </div>

                <!-- New Password -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                  <input
                    v-model="passwordForm.newPassword"
                    type="password"
                    class="w-full max-w-md px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Min 8 characters"
                  />
                </div>

                <!-- Confirm Password -->
                <div>
                  <label class="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                  <input
                    v-model="passwordForm.confirmPassword"
                    type="password"
                    class="w-full max-w-md px-3 py-2 text-sm bg-gray-900/50 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Confirm new password"
                  />
                </div>

                <!-- Update Password Button -->
                <button
                  @click="savePassword"
                  :disabled="savingPassword"
                  class="px-3 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg v-if="savingPassword" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {{ savingPassword ? 'Updating...' : 'Update Password' }}
                </button>
              </div>
            </div>

            <!-- Profile Buttons -->
            <div class="flex gap-3 pt-4">
              <button
                @click="saveProfile"
                :disabled="savingProfile || !!profileSuccess"
                class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg v-if="savingProfile" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ savingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
              <button
                @click="cancelEditingProfile"
                :disabled="savingProfile || !!profileSuccess"
                class="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 text-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-2 mb-4">
          <button
            @click="activeTab = 'submissions'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'submissions'
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                : 'bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/60'
            ]"
          >
            Submissions ({{ submissions.length }})
          </button>
          <button
            @click="activeTab = 'comments'"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === 'comments'
                ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300'
                : 'bg-gray-800/40 border border-gray-700/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/60'
            ]"
          >
            Comments ({{ comments.length }})
          </button>
        </div>

        <!-- Submissions Tab -->
        <div v-if="activeTab === 'submissions'" class="space-y-1.5">
          <div v-if="submissions.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No submissions yet</p>
            <router-link 
              to="/submit" 
              class="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              Submit Your First Conversation
            </router-link>
          </div>

          <div
            v-for="submission in submissions"
            :key="submission.id"
            @click="router.push(`/submissions/${submission.id}`)"
            class="group bg-gray-800/40 backdrop-blur-sm rounded border border-gray-700/50 hover:border-indigo-500/30 hover:bg-gray-800/60 transition-all cursor-pointer px-3 py-2"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <!-- Title + Date -->
              <div class="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <h3 class="text-sm font-medium text-gray-100 group-hover:text-indigo-300 transition-colors truncate flex-1 min-w-0">
                  {{ submission.title }}
                </h3>
                <div class="flex items-center gap-2 text-[11px] text-gray-500 shrink-0">
                  <span class="hidden sm:inline">{{ formatDate(submission.submitted_at) }}</span>
                </div>
              </div>
              
              <!-- Stats -->
              <div class="flex items-center gap-3 text-[11px] text-gray-500">
                <span v-if="submission.metadata.model_summary?.length" class="truncate max-w-[120px]">
                  {{ submission.metadata.model_summary[0] }}{{ submission.metadata.model_summary.length > 1 ? ` +${submission.metadata.model_summary.length - 1}` : '' }}
                </span>
                
                <!-- Tags & Comments Count -->
                <div class="flex items-center gap-2">
                  <span v-if="submission.stats.tag_count > 0" class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {{ submission.stats.tag_count }}
                  </span>
                  <span v-if="submission.stats.comment_count > 0" class="flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ submission.stats.comment_count }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments Tab -->
        <div v-if="activeTab === 'comments'" class="space-y-2">
          <div v-if="comments.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p>No comments yet</p>
            <router-link 
              to="/browse" 
              class="inline-block mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
            >
              Browse Conversations
            </router-link>
          </div>

          <div
            v-for="comment in comments"
            :key="comment.id"
            class="bg-gray-800/40 backdrop-blur-sm rounded border border-gray-700/50 hover:border-indigo-500/30 transition-all"
          >
            <!-- Submission Header (clickable) -->
            <div 
              @click="router.push(`/submissions/${comment.submission_id}`)"
              class="px-3 py-2 bg-gray-900/30 border-b border-gray-700/50 cursor-pointer hover:bg-gray-900/50 transition-colors flex items-center justify-between"
            >
              <div class="flex items-center gap-2 flex-1 min-w-0">
                <svg class="w-3.5 h-3.5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span class="text-xs text-gray-400 truncate">{{ comment.submission_title }}</span>
              </div>
              <span class="text-[10px] text-gray-500 shrink-0 ml-2">{{ formatDate(comment.created_at) }}</span>
            </div>
            
            <!-- Comment Content -->
            <div class="px-3 py-2.5">
              <p class="text-sm text-gray-200 whitespace-pre-wrap">{{ comment.content }}</p>
            </div>
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
import { authAPI } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref<'submissions' | 'comments'>('submissions')

const submissions = ref<any[]>([])
const comments = ref<any[]>([])

// Profile editing
const isEditingProfile = ref(false)
const editForm = ref({
  name: '',
  email: ''
})
const savingProfile = ref(false)
const profileError = ref<string | null>(null)
const profileSuccess = ref<string | null>(null)

// Password editing
const isEditingPassword = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const savingPassword = ref(false)
const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await loadProfile()
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadProfile() {
  loading.value = true
  error.value = null
  
  try {
    const response = await authAPI.getProfile()
    submissions.value = response.data.submissions
    comments.value = response.data.comments
  } catch (err: any) {
    console.error('Failed to load profile:', err)
    error.value = err.response?.data?.error || 'Failed to load profile'
  } finally {
    loading.value = false
  }
}

function startEditingProfile() {
  editForm.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || ''
  }
  profileError.value = null
  profileSuccess.value = null
  isEditingProfile.value = true
}

function cancelEditingProfile() {
  isEditingProfile.value = false
  profileError.value = null
  profileSuccess.value = null
  // Also reset password editing state
  isEditingPassword.value = false
  passwordError.value = null
  passwordSuccess.value = null
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

async function saveProfile() {
  profileError.value = null
  profileSuccess.value = null
  
  // Validation
  if (!editForm.value.name.trim()) {
    profileError.value = 'Name is required'
    return
  }
  
  if (!editForm.value.email.trim()) {
    profileError.value = 'Email is required'
    return
  }
  
  // Check if anything actually changed
  const nameChanged = editForm.value.name.trim() !== authStore.user?.name
  const emailChanged = editForm.value.email.trim() !== authStore.user?.email
  
  if (!nameChanged && !emailChanged) {
    profileError.value = 'No changes to save'
    return
  }
  
  savingProfile.value = true
  
  try {
    const updates: { name?: string; email?: string } = {}
    if (nameChanged) {
      updates.name = editForm.value.name.trim()
    }
    if (emailChanged) {
      updates.email = editForm.value.email.trim()
    }
    
    const response = await authAPI.updateProfile(updates)
    
    // Update local auth store with new token and user
    authStore.token = response.data.token
    authStore.user = response.data.user
    localStorage.setItem('auth_token', response.data.token)
    localStorage.setItem('auth_user', JSON.stringify(response.data.user))
    
    profileSuccess.value = response.data.message || 'Profile updated successfully'
    
    setTimeout(() => {
      isEditingProfile.value = false
      profileSuccess.value = null
    }, 2000)
  } catch (err: any) {
    console.error('Failed to update profile:', err)
    profileError.value = err.response?.data?.error || 'Failed to update profile'
  } finally {
    savingProfile.value = false
  }
}

function startEditingPassword() {
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordError.value = null
  passwordSuccess.value = null
  isEditingPassword.value = true
}

function cancelEditingPassword() {
  isEditingPassword.value = false
  passwordError.value = null
  passwordSuccess.value = null
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
}

async function savePassword() {
  passwordError.value = null
  passwordSuccess.value = null
  
  // Validation
  if (!passwordForm.value.currentPassword) {
    passwordError.value = 'Current password is required'
    return
  }
  
  if (!passwordForm.value.newPassword) {
    passwordError.value = 'New password is required'
    return
  }
  
  if (passwordForm.value.newPassword.length < 8) {
    passwordError.value = 'New password must be at least 8 characters'
    return
  }
  
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'Passwords do not match'
    return
  }
  
  savingPassword.value = true
  
  try {
    const response = await authAPI.updatePassword(passwordForm.value)
    
    passwordSuccess.value = response.data.message || 'Password updated successfully'
    
    setTimeout(() => {
      isEditingPassword.value = false
      passwordSuccess.value = null
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }, 2000)
  } catch (err: any) {
    console.error('Failed to update password:', err)
    passwordError.value = err.response?.data?.error || 'Failed to update password'
  } finally {
    savingPassword.value = false
  }
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
}
</script>

