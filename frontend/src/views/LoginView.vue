<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950">
    <div class="max-w-md w-full bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-8">
      <h1 class="text-3xl font-bold text-center mb-2 text-gray-100">Research Commons</h1>
      <p class="text-gray-400 text-center mb-8">Anima Labs</p>

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

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-300 mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

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

