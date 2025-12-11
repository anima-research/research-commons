<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950">
    <div class="max-w-md w-full bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-8">
      <h1 class="text-2xl font-bold text-center mb-2 text-gray-100">Reset Password</h1>
      <p class="text-gray-400 text-center mb-8">Enter your email to receive a reset link</p>

      <!-- Success state -->
      <div v-if="submitted" class="text-center">
        <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-100 mb-2">Check your email</h2>
        <p class="text-gray-400 text-sm mb-6">
          If an account with that email exists, we've sent a password reset link. 
          The link will expire in 24 hours.
        </p>
        <div class="space-y-3">
          <button
            @click="submitted = false; email = ''"
            class="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
          >
            Try another email
          </button>
          <router-link
            to="/login"
            class="block w-full py-2 text-center text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
          >
            ← Back to Login
          </router-link>
        </div>
      </div>

      <!-- Form state -->
      <form v-else @submit.prevent="handleSubmit">
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
            class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
        >
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>

        <router-link
          to="/login"
          class="block w-full py-2 text-center text-gray-400 hover:text-gray-300 text-sm transition-colors"
        >
          ← Back to Login
        </router-link>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { authAPI } from '@/services/api'

const email = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

async function handleSubmit() {
  if (!email.value.trim()) return
  
  loading.value = true
  error.value = ''
  
  try {
    await authAPI.forgotPassword(email.value)
    submitted.value = true
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


