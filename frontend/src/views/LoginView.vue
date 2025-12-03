<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950">
    <div class="max-w-md w-full bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-8">
      <h1 class="text-3xl font-bold text-center mb-2 text-gray-100">Research Commons</h1>
      <p class="text-gray-400 text-center mb-8">Anima Labs</p>

      <!-- Already logged in - show profile -->
      <div v-if="authStore.isAuthenticated()">
        <div class="text-center mb-6">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            {{ getInitials(authStore.user?.name) }}
          </div>
          <h2 class="text-xl font-semibold text-gray-100 mb-1">{{ authStore.user?.name }}</h2>
          <p class="text-sm text-gray-400">{{ authStore.user?.email }}</p>
          <div class="flex gap-2 justify-center mt-3">
            <span
              v-for="role in authStore.user?.roles"
              :key="role"
              class="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded-full border border-indigo-500/30"
            >
              {{ role }}
            </span>
          </div>
        </div>

        <div class="space-y-3">
          <button
            @click="router.push('/browse')"
            class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Go to Browse
          </button>
          <button
            @click="handleSignOut"
            class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            Sign Out
          </button>
          <button
            @click="router.push('/')"
            class="w-full py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <!-- Not logged in - show login/register forms -->
      <div v-else>
        <div class="mb-6">
          <div class="flex border-b border-gray-700">
            <button
              @click="isLogin = true"
              class="flex-1 py-2 text-center transition-colors"
              :class="isLogin ? 'border-b-2 border-indigo-600 text-indigo-400 font-medium' : 'text-gray-400'"
            >
              Login
            </button>
            <button
              @click="isLogin = false"
              class="flex-1 py-2 text-center transition-colors"
              :class="!isLogin ? 'border-b-2 border-indigo-600 text-indigo-400 font-medium' : 'text-gray-400'"
            >
              Register
            </button>
          </div>
        </div>

        <form @submit.prevent="handleSubmit">
          <div v-if="!isLogin" class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-1">Name</label>
            <input
              v-model="name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              required
              minlength="8"
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div v-if="isLogin" class="mb-6 text-right">
            <router-link 
              to="/forgot-password" 
              class="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Forgot password?
            </router-link>
          </div>
          <div v-else class="mb-6"></div>

          <div v-if="authStore.error" class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
            {{ authStore.error }}
          </div>

          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ authStore.loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register') }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const name = ref('')

function getInitials(name: string | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

function handleSignOut() {
  authStore.logout()
  // Stay on the login page to show the login form
}

async function handleSubmit() {
  const success = isLogin.value
    ? await authStore.login(email.value, password.value)
    : await authStore.register(email.value, password.value, name.value)

  if (success) {
    const redirect = (route.query.redirect as string) || '/'
    router.push(redirect)
  }
}
</script>

