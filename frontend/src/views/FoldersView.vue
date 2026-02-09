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
      <!-- Header -->
      <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 px-4 py-4 transition-colors">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100">Folders</h1>
          </div>
          <button
            v-if="authStore.hasRole('researcher') || authStore.hasRole('admin')"
            @click="showCreateModal = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition-colors"
          >
            + New Folder
          </button>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
        Loading folders...
      </div>

      <!-- Empty state -->
      <div v-else-if="folders.length === 0" class="text-center py-16 px-4">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 mb-4">No folders yet.</p>
        <button
          v-if="authStore.hasRole('researcher') || authStore.hasRole('admin')"
          @click="showCreateModal = true"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create First Folder
        </button>
      </div>

      <!-- Folder grid -->
      <div v-else class="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <router-link
          v-for="folder in folders"
          :key="folder.id"
          :to="`/folders/${folder.id}`"
          class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
        >
          <!-- Folder icon + name -->
          <div class="flex items-start gap-3 mb-3">
            <svg class="w-8 h-8 text-indigo-400 group-hover:text-indigo-500 transition-colors shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
            </svg>
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ folder.name }}</h3>
              <p v-if="folder.description" class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                {{ folder.description }}
              </p>
            </div>
          </div>

          <!-- Visibility badge -->
          <div class="flex items-center gap-2 text-xs">
            <span v-if="folder.visibility === 'private'" class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
              🔒 Private
            </span>
            <span v-else-if="folder.visibility === 'shared'" class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
              👥 Shared<template v-if="folder.required_role"> ({{ folder.required_role }}s)</template>
            </span>
            <span v-else class="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">
              🌐 Public
            </span>

            <span v-if="folder.created_by === authStore.user?.id" class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded">
              Owner
            </span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Create Folder Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create Folder</h3>

        <div class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              v-model="newFolder.name"
              type="text"
              placeholder="e.g., Model Welfare Research"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
            <textarea
              v-model="newFolder.description"
              rows="2"
              placeholder="What's this folder for?"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <!-- Visibility -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Visibility</label>
            <select
              v-model="newFolder.visibility"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="private">🔒 Private - Only you</option>
              <option value="shared">👥 Shared - Role or specific users</option>
              <option value="public">🌐 Public - Everyone</option>
            </select>
          </div>

          <!-- Shared options -->
          <template v-if="newFolder.visibility === 'shared'">
            <!-- Role requirement -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Required Role (optional)</label>
              <select
                v-model="newFolder.required_role"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None - whitelist only</option>
                <option value="researcher">Researcher</option>
                <option value="admin">Admin</option>
                <option value="expert">Expert</option>
                <option value="rater">Rater</option>
                <option value="contributor">Contributor</option>
              </select>
            </div>

            <!-- User whitelist -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Share with users</label>
              <div class="relative">
                <input
                  v-model="userSearchQuery"
                  @input="searchUsers"
                  @focus="searchUsers(); showUserDropdown = true"
                  @blur="hideDropdownDelayed"
                  type="text"
                  autocomplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  placeholder="Search by name or email..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <!-- Dropdown -->
                <div
                  v-if="showUserDropdown && userSearchResults.length > 0"
                  class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto"
                >
                  <button
                    v-for="user in userSearchResults"
                    :key="user.id"
                    @mousedown.prevent="addSelectedUser(user)"
                    class="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-900 dark:text-gray-100 flex justify-between items-center"
                  >
                    <span>{{ user.name }}</span>
                    <span class="text-xs text-gray-400">{{ user.email }}</span>
                  </button>
                </div>
              </div>

              <!-- Selected users -->
              <div v-if="selectedUsers.length > 0" class="flex flex-wrap gap-2 mt-2">
                <span
                  v-for="user in selectedUsers"
                  :key="user.id"
                  class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs"
                >
                  {{ user.name }}
                  <button @click="removeSelectedUser(user.id)" class="hover:text-red-500 ml-0.5">&times;</button>
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ newFolder.required_role ? 'These users get access in addition to the role requirement.' : 'Only these users (and you) will have access.' }}
              </p>
            </div>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6">
          <button
            @click="showCreateModal = false"
            class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            @click="createFolder"
            :disabled="!newFolder.name.trim() || creating"
            class="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {{ creating ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { foldersAPI, type Folder, type FolderVisibility } from '@/services/api'
import LeftSidebar from '@/components/LeftSidebar.vue'

const router = useRouter()
const authStore = useAuthStore()

const showMobileSidebar = ref(false)
const isMobile = ref(window.innerWidth < 1024)
const loading = ref(false)
const creating = ref(false)

const folders = ref<Folder[]>([])
const showCreateModal = ref(false)

const newFolder = ref<{
  name: string
  description: string
  visibility: FolderVisibility
  required_role: string
}>({
  name: '',
  description: '',
  visibility: 'private',
  required_role: ''
})

// User search for member whitelist
const userSearchQuery = ref('')
const userSearchResults = ref<{ id: string; name: string; email: string }[]>([])
const selectedUsers = ref<{ id: string; name: string; email: string }[]>([])
const showUserDropdown = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

onMounted(async () => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth < 1024
  })
  await loadFolders()
})

function handleNavigate(route: string) {
  router.push(route)
}

async function loadFolders() {
  loading.value = true
  try {
    const response = await foldersAPI.list()
    folders.value = response.data.folders
  } catch (error) {
    console.error('Failed to load folders:', error)
  } finally {
    loading.value = false
  }
}

function hideDropdownDelayed() {
  setTimeout(() => { showUserDropdown.value = false }, 200)
}

function searchUsers() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    try {
      const response = await foldersAPI.searchUsers(userSearchQuery.value)
      // Filter out already-selected users
      const selectedIds = new Set(selectedUsers.value.map(u => u.id))
      userSearchResults.value = response.data.users.filter(u => !selectedIds.has(u.id))
      showUserDropdown.value = true
    } catch (e) {
      userSearchResults.value = []
    }
  }, 250)
}

function addSelectedUser(user: { id: string; name: string; email: string }) {
  if (!selectedUsers.value.find(u => u.id === user.id)) {
    selectedUsers.value.push(user)
  }
  userSearchQuery.value = ''
  userSearchResults.value = []
  showUserDropdown.value = false
}

function removeSelectedUser(userId: string) {
  selectedUsers.value = selectedUsers.value.filter(u => u.id !== userId)
}

async function createFolder() {
  if (!newFolder.value.name.trim()) return

  creating.value = true
  try {
    const data: any = {
      name: newFolder.value.name.trim(),
      visibility: newFolder.value.visibility
    }
    if (newFolder.value.description.trim()) {
      data.description = newFolder.value.description.trim()
    }
    if (newFolder.value.visibility === 'shared' && newFolder.value.required_role) {
      data.required_role = newFolder.value.required_role
    }

    const response = await foldersAPI.create(data)
    const folderId = response.data.folder.id

    // Add selected members
    const memberErrors: string[] = []
    for (const user of selectedUsers.value) {
      try {
        await foldersAPI.addMember(folderId, user.id)
      } catch {
        memberErrors.push(user.name)
      }
    }

    if (memberErrors.length > 0) {
      alert(`Folder created, but failed to add: ${memberErrors.join(', ')}`)
    }

    showCreateModal.value = false
    // Reset form
    newFolder.value = { name: '', description: '', visibility: 'private', required_role: '' }
    selectedUsers.value = []
    userSearchQuery.value = ''
    // Navigate to the new folder
    router.push(`/folders/${folderId}`)
  } catch (error) {
    console.error('Failed to create folder:', error)
    alert('Failed to create folder')
  } finally {
    creating.value = false
  }
}
</script>
