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
            <svg class="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h1 class="text-lg font-semibold text-gray-100">User Management</h1>
          </div>
          
          <!-- Stats badges -->
          <div class="flex items-center gap-3 text-sm">
            <div class="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full text-cyan-300">
              <span class="font-semibold">{{ users.length }}</span> users
            </div>
            <div class="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full text-purple-300">
              <span class="font-semibold">{{ adminCount }}</span> admins
            </div>
            <div class="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-blue-300">
              <span class="font-semibold">{{ contributorCount }}</span> trusted
            </div>
          </div>
        </div>
        
        <!-- Search and filter bar -->
        <div class="px-6 pb-4 flex items-center gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by name or email..."
              class="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
            />
          </div>
          <select
            v-model="roleFilter"
            class="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">All Roles</option>
            <option value="member">Members</option>
            <option value="contributor">Contributors</option>
            <option value="researcher">Researchers</option>
            <option value="admin">Admins</option>
            <option value="agent">Agents</option>
          </select>
        </div>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="px-6 text-center py-12 text-gray-500">
        <svg class="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading users...
      </div>

      <!-- User Cards -->
      <div v-else class="px-6 py-6 space-y-3">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700/50 p-4"
        >
          <div class="flex items-center justify-between">
            <!-- User info -->
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {{ user.name.charAt(0).toUpperCase() }}
              </div>
              <div>
                <div class="font-medium text-gray-100">{{ user.name }}</div>
                <div class="text-sm text-gray-400">{{ user.email }}</div>
                <div class="text-xs text-gray-500 mt-1">
                  Joined {{ formatDate(user.created_at) }}
                </div>
              </div>
            </div>
            
            <!-- Role badges and actions -->
            <div class="flex items-center gap-3">
              <!-- Role badges -->
              <div class="flex flex-wrap gap-1 max-w-xs justify-end">
                <span
                  v-for="role in user.roles"
                  :key="role"
                  :class="getRoleBadgeClass(role)"
                  class="px-2 py-0.5 rounded text-xs font-medium border"
                >
                  {{ role }}
                </span>
              </div>
              
              <!-- Quick actions -->
              <div class="flex items-center gap-2 ml-4">
                <!-- Trust/Revoke button -->
                <button
                  v-if="!user.roles.includes('contributor') && !user.roles.includes('admin')"
                  @click="addRole(user, 'contributor')"
                  :disabled="updating === user.id"
                  class="px-3 py-1.5 text-xs bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded transition-colors disabled:opacity-50"
                  title="Add contributor role (trusted poster)"
                >
                  Trust
                </button>
                <button
                  v-else-if="user.roles.includes('contributor') && !user.roles.includes('admin')"
                  @click="removeRole(user, 'contributor')"
                  :disabled="updating === user.id"
                  class="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 border border-gray-600/50 text-gray-400 rounded transition-colors disabled:opacity-50"
                  title="Remove contributor role"
                >
                  Revoke
                </button>
                
                <!-- Edit button -->
                <button
                  @click="openEditor(user)"
                  class="px-3 py-1.5 text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 rounded transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Empty state -->
        <div v-if="filteredUsers.length === 0" class="text-center py-12">
          <svg class="w-12 h-12 mx-auto mb-3 text-gray-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div class="text-gray-400">No users match your search</div>
        </div>
      </div>
    </div>
    
    <!-- Role Editor Modal -->
    <div
      v-if="editingUser"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click.self="editingUser = null"
    >
      <div class="bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-gray-100 mb-2">Edit Roles</h3>
        <p class="text-sm text-gray-400 mb-4">
          Manage roles for <span class="text-gray-200 font-medium">{{ editingUser.name }}</span>
        </p>
        
        <!-- Role checkboxes -->
        <div class="space-y-2 mb-6">
          <label
            v-for="role in availableRoles"
            :key="role.value"
            class="flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer"
            :class="editingRoles.includes(role.value) 
              ? 'bg-gray-800/80 border-gray-600' 
              : 'bg-gray-800/30 border-gray-700/50 hover:border-gray-600'"
          >
            <input
              type="checkbox"
              :checked="editingRoles.includes(role.value)"
              @change="toggleRole(role.value)"
              :disabled="role.value === 'admin' && editingUser.id === currentUserId"
              class="w-4 h-4 rounded border-gray-600 bg-gray-700 text-cyan-500 focus:ring-cyan-500/50 disabled:opacity-50"
            />
            <div class="flex-1">
              <div class="text-sm font-medium text-gray-200">{{ role.label }}</div>
              <div class="text-xs text-gray-500">{{ role.description }}</div>
            </div>
            <span
              :class="getRoleBadgeClass(role.value)"
              class="px-2 py-0.5 rounded text-xs font-medium border"
            >
              {{ role.value }}
            </span>
          </label>
        </div>
        
        <!-- Warning for self-admin -->
        <div
          v-if="editingUser.id === currentUserId && editingUser.roles.includes('admin')"
          class="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300"
        >
          ⚠️ You cannot remove your own admin role
        </div>
        
        <div class="flex gap-3">
          <button
            @click="editingUser = null"
            class="flex-1 px-4 py-2 border border-gray-700 text-gray-300 hover:bg-gray-800 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            @click="saveRoles"
            :disabled="updating === editingUser.id"
            class="flex-1 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-300 rounded transition-colors disabled:opacity-50"
          >
            {{ updating === editingUser.id ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { adminAPI } from '@/services/api'
import type { User } from '@/types'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const updating = ref<string | null>(null)

const users = ref<User[]>([])
const searchQuery = ref('')
const roleFilter = ref('')

// Editor state
const editingUser = ref<User | null>(null)
const editingRoles = ref<string[]>([])

const currentUserId = computed(() => authStore.user?.id)

const availableRoles = [
  { value: 'member', label: 'Member', description: 'Base role, submissions go to screening' },
  { value: 'contributor', label: 'Contributor', description: 'Trusted poster, bypasses screening' },
  { value: 'researcher', label: 'Researcher', description: 'Can access screening queue' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
  { value: 'agent', label: 'Agent', description: 'Bot/crawler account' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access' },
  { value: 'rater', label: 'Rater', description: 'Can rate submissions' },
  { value: 'expert', label: 'Expert', description: 'Domain expert' }
]

// Stats
const adminCount = computed(() => users.value.filter(u => u.roles.includes('admin')).length)
const contributorCount = computed(() => users.value.filter(u => u.roles.includes('contributor')).length)

// Filtered users
const filteredUsers = computed(() => {
  let result = users.value
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(u => 
      u.name.toLowerCase().includes(query) || 
      u.email.toLowerCase().includes(query)
    )
  }
  
  // Apply role filter
  if (roleFilter.value) {
    result = result.filter(u => u.roles.includes(roleFilter.value))
  }
  
  return result
})

onMounted(() => {
  window.addEventListener('resize', checkMobile)
  loadUsers()
})

function checkMobile() {
  isMobile.value = window.innerWidth < 1024
}

function handleNavigate(route: string) {
  router.push(route)
}

async function loadUsers() {
  loading.value = true
  try {
    const response = await adminAPI.getUsers()
    users.value = response.data.users
  } catch (error) {
    console.error('Failed to load users:', error)
  } finally {
    loading.value = false
  }
}

function getRoleBadgeClass(role: string): string {
  const colors: Record<string, string> = {
    member: 'bg-gray-500/20 border-gray-500/30 text-gray-300',
    viewer: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
    contributor: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    rater: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
    expert: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    researcher: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    agent: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
    admin: 'bg-red-500/20 border-red-500/30 text-red-300'
  }
  return colors[role] || 'bg-gray-500/20 border-gray-500/30 text-gray-300'
}

async function addRole(user: User, role: string) {
  if (user.roles.includes(role)) return
  
  updating.value = user.id
  try {
    const newRoles = [...user.roles, role]
    const response = await adminAPI.updateRoles(user.id, newRoles)
    
    // Update local state
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1 && response.data.user) {
      users.value[idx] = response.data.user
    }
    
    console.log(`[Admin] Added role ${role} to user ${user.name}`)
  } catch (error) {
    console.error('Failed to add role:', error)
    alert('Failed to update user roles')
  } finally {
    updating.value = null
  }
}

async function removeRole(user: User, role: string) {
  if (!user.roles.includes(role)) return
  
  updating.value = user.id
  try {
    const newRoles = user.roles.filter(r => r !== role)
    const response = await adminAPI.updateRoles(user.id, newRoles)
    
    // Update local state
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1 && response.data.user) {
      users.value[idx] = response.data.user
    }
    
    console.log(`[Admin] Removed role ${role} from user ${user.name}`)
  } catch (error) {
    console.error('Failed to remove role:', error)
    alert('Failed to update user roles')
  } finally {
    updating.value = null
  }
}

function openEditor(user: User) {
  editingUser.value = user
  editingRoles.value = [...user.roles]
}

function toggleRole(role: string) {
  // Prevent removing own admin role
  if (role === 'admin' && editingUser.value?.id === currentUserId.value) {
    return
  }
  
  if (editingRoles.value.includes(role)) {
    editingRoles.value = editingRoles.value.filter(r => r !== role)
  } else {
    editingRoles.value.push(role)
  }
}

async function saveRoles() {
  if (!editingUser.value) return
  
  updating.value = editingUser.value.id
  try {
    const response = await adminAPI.updateRoles(editingUser.value.id, editingRoles.value)
    
    // Update local state
    const idx = users.value.findIndex(u => u.id === editingUser.value!.id)
    if (idx !== -1 && response.data.user) {
      users.value[idx] = response.data.user
    }
    
    console.log(`[Admin] Updated roles for ${editingUser.value.name}:`, editingRoles.value)
    editingUser.value = null
  } catch (error: any) {
    console.error('Failed to save roles:', error)
    alert(error.response?.data?.error || 'Failed to update user roles')
  } finally {
    updating.value = null
  }
}

function formatDate(date: string | Date) {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

