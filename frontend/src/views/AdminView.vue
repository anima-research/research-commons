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
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h1 class="text-lg font-semibold text-gray-100">Admin Panel</h1>
            </div>
            
            <!-- Refresh button -->
            <button
              @click="loadData"
              :disabled="loading"
              class="px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <svg :class="['w-4 h-4', loading && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading && !users.length" class="px-6 text-center py-12 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading admin data...
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

      <!-- Main Content -->
      <div v-else class="px-6 pb-8">
        <!-- System Stats Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-6">
          <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div class="text-2xl font-bold text-gray-100">{{ systemStats?.total_users || 0 }}</div>
            <div class="text-xs text-gray-400 mt-1">Total Users</div>
          </div>
          <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div class="text-2xl font-bold text-gray-100">{{ systemStats?.total_submissions || 0 }}</div>
            <div class="text-xs text-gray-400 mt-1">Total Submissions</div>
          </div>
          <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div class="text-2xl font-bold text-gray-100">{{ systemStats?.users_by_role?.admin || 0 }}</div>
            <div class="text-xs text-gray-400 mt-1">Admins</div>
          </div>
          <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4">
            <div class="text-2xl font-bold text-gray-100">{{ systemStats?.users_by_role?.researcher || 0 }}</div>
            <div class="text-xs text-gray-400 mt-1">Researchers</div>
          </div>
        </div>

        <!-- Role Distribution -->
        <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4 mb-6">
          <h3 class="text-sm font-medium text-gray-300 mb-3">Users by Role</h3>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="(count, role) in systemStats?.users_by_role" 
              :key="role"
              class="px-3 py-1.5 rounded-lg text-xs font-medium"
              :class="getRoleBadgeClass(role as string)"
            >
              {{ role }}: {{ count }}
            </div>
          </div>
        </div>

        <!-- User Management Section -->
        <div class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 overflow-hidden">
          <!-- Header with search -->
          <div class="px-4 py-3 border-b border-gray-700/50 flex flex-col sm:flex-row sm:items-center gap-3">
            <h3 class="text-sm font-medium text-gray-300">User Management</h3>
            
            <div class="flex-1 flex gap-2">
              <!-- Search -->
              <div class="relative flex-1 max-w-md">
                <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search users..."
                  class="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <!-- Role filter -->
              <select
                v-model="roleFilter"
                class="px-3 py-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="researcher">Researcher</option>
                <option value="expert">Expert</option>
                <option value="rater">Rater</option>
                <option value="contributor">Contributor</option>
                <option value="agent">Agent</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>

          <!-- User List -->
          <div class="divide-y divide-gray-700/50">
            <div
              v-for="user in filteredUsers"
              :key="user.id"
              class="px-4 py-3 hover:bg-gray-800/30 transition-colors"
            >
              <div class="flex flex-col lg:flex-row lg:items-center gap-3">
                <!-- User Info -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <!-- Avatar -->
                  <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                    {{ getInitials(user.name) }}
                  </div>
                  
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-medium text-gray-100 truncate">{{ user.name }}</span>
                      <span v-if="user.id === authStore.user?.id" class="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">You</span>
                    </div>
                    <div class="text-xs text-gray-400 truncate">{{ user.email }}</div>
                  </div>
                </div>

                <!-- Roles -->
                <div class="flex flex-wrap gap-1.5">
                  <div
                    v-for="role in allRoles"
                    :key="role"
                    class="tooltip-wrapper"
                  >
                    <button
                      @click="toggleRole(user, role)"
                      :disabled="isRoleToggleDisabled(user, role)"
                      :class="[
                        'px-2 py-1 text-[11px] rounded-md font-medium transition-all',
                        user.roles.includes(role)
                          ? getRoleBadgeClass(role)
                          : 'bg-gray-700/30 text-gray-500 hover:bg-gray-700/50 hover:text-gray-400',
                        isRoleToggleDisabled(user, role) && 'opacity-50 cursor-not-allowed'
                      ]"
                    >
                      {{ role }}
                    </button>
                    <span class="tooltip">{{ getRoleToggleTitle(user, role) }}</span>
                  </div>
                </div>

                <!-- Stats -->
                <div class="flex gap-4 text-xs text-gray-400 lg:w-48 shrink-0">
                  <div class="flex items-center gap-1 tooltip-wrapper">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {{ user.stats.submission_count }}
                    <span class="tooltip">Submissions</span>
                  </div>
                  <div class="flex items-center gap-1 tooltip-wrapper">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {{ user.stats.comment_count }}
                    <span class="tooltip">Comments</span>
                  </div>
                  <div class="flex items-center gap-1 tooltip-wrapper">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {{ user.stats.tag_count }}
                    <span class="tooltip">Tags Applied</span>
                  </div>
                  <div class="flex items-center gap-1 tooltip-wrapper">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {{ user.stats.rating_count }}
                    <span class="tooltip">Ratings</span>
                  </div>
                </div>

                <!-- Join Date -->
                <div class="text-xs text-gray-500 lg:w-24 shrink-0">
                  {{ formatDate(user.created_at) }}
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="filteredUsers.length === 0" class="px-4 py-8 text-center text-gray-500">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p v-if="searchQuery || roleFilter">No users match your filters</p>
              <p v-else>No users found</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast Notification -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="toast"
          :class="[
            'fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-xl backdrop-blur-sm z-50 flex items-center gap-2',
            toast.type === 'success' ? 'bg-green-900/90 text-green-200 border border-green-700/50' : 'bg-red-900/90 text-red-200 border border-red-700/50'
          ]"
        >
          <svg v-if="toast.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          {{ toast.message }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminAPI, type AdminUser, type SystemStats } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const error = ref<string | null>(null)

const users = ref<AdminUser[]>([])
const systemStats = ref<SystemStats | null>(null)
const searchQuery = ref('')
const roleFilter = ref('')

const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)

const allRoles = ['admin', 'researcher', 'expert', 'rater', 'contributor', 'agent', 'viewer'] as const

onMounted(async () => {
  window.addEventListener('resize', checkMobile)
  await loadData()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadData() {
  loading.value = true
  error.value = null
  
  try {
    const [usersResponse, statsResponse] = await Promise.all([
      adminAPI.getUsers(),
      adminAPI.getStats()
    ])
    
    users.value = usersResponse.data.users
    systemStats.value = statsResponse.data.stats
  } catch (err: any) {
    console.error('Failed to load admin data:', err)
    error.value = err.response?.data?.error || 'Failed to load admin data'
  } finally {
    loading.value = false
  }
}

const filteredUsers = computed(() => {
  let result = [...users.value]
  
  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    )
  }
  
  // Role filter
  if (roleFilter.value) {
    result = result.filter(user => user.roles.includes(roleFilter.value as any))
  }
  
  // Sort by creation date (newest first)
  return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
})

async function toggleRole(user: AdminUser, role: string) {
  if (isRoleToggleDisabled(user, role)) return
  
  const hasRole = user.roles.includes(role as any)
  
  try {
    if (hasRole) {
      await adminAPI.removeUserRole(user.id, role)
      // Update local state
      const index = users.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        users.value[index].roles = users.value[index].roles.filter(r => r !== role) as any
        // If no roles left, add viewer
        if (users.value[index].roles.length === 0) {
          users.value[index].roles = ['viewer']
        }
      }
      showToast('success', `Removed ${role} role from ${user.name}`)
    } else {
      await adminAPI.addUserRole(user.id, role as any)
      // Update local state
      const index = users.value.findIndex(u => u.id === user.id)
      if (index !== -1) {
        users.value[index].roles = [...users.value[index].roles, role] as any
      }
      showToast('success', `Added ${role} role to ${user.name}`)
    }
    
    // Refresh stats
    const statsResponse = await adminAPI.getStats()
    systemStats.value = statsResponse.data.stats
  } catch (err: any) {
    console.error('Failed to update role:', err)
    showToast('error', err.response?.data?.error || 'Failed to update role')
  }
}

function isRoleToggleDisabled(user: AdminUser, role: string): boolean {
  // Can't remove admin from yourself
  if (user.id === authStore.user?.id && role === 'admin' && user.roles.includes('admin')) {
    return true
  }
  return false
}

function getRoleToggleTitle(user: AdminUser, role: string): string {
  if (isRoleToggleDisabled(user, role)) {
    return "Cannot remove admin role from yourself"
  }
  const hasRole = user.roles.includes(role as any)
  return hasRole ? `Remove ${role} role` : `Add ${role} role`
}

function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    admin: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    researcher: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    expert: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    rater: 'bg-green-500/20 text-green-300 border border-green-500/30',
    contributor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
    agent: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    viewer: 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
  }
  return classes[role] || classes.viewer
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(date: string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  setTimeout(() => {
    toast.value = null
  }, 3000)
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}

/* Instant tooltips */
.tooltip-wrapper {
  position: relative;
}

.tooltip-wrapper .tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 8px;
  background: rgba(17, 24, 39, 0.95);
  border: 1px solid rgba(75, 85, 99, 0.5);
  border-radius: 6px;
  font-size: 11px;
  color: #e5e7eb;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s ease;
  z-index: 50;
  margin-bottom: 6px;
}

.tooltip-wrapper .tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgba(75, 85, 99, 0.5);
}

.tooltip-wrapper:hover .tooltip {
  opacity: 1;
}
</style>
