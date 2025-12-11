<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 to-indigo-950">
    <div class="max-w-md w-full bg-gray-900 rounded-lg shadow-lg border border-gray-800 p-8">
      
      <!-- Loading state -->
      <div v-if="validating" class="text-center py-8">
        <div class="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-400">Validating reset link...</p>
      </div>

      <!-- Invalid token state -->
      <div v-else-if="!tokenValid" class="text-center">
        <div class="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-100 mb-2">Invalid or Expired Link</h2>
        <p class="text-gray-400 text-sm mb-6">
          This password reset link is invalid or has expired. 
          Please request a new one.
        </p>
        <div class="space-y-3">
          <router-link
            to="/forgot-password"
            class="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors text-center"
          >
            Request New Link
          </router-link>
          <router-link
            to="/login"
            class="block w-full py-2 text-center text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            ← Back to Login
          </router-link>
        </div>
      </div>

      <!-- Success state -->
      <div v-else-if="success" class="text-center">
        <div class="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mx-auto mb-4">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-lg font-semibold text-gray-100 mb-2">Password Reset!</h2>
        <p class="text-gray-400 text-sm mb-6">
          Your password has been successfully reset. 
          You can now log in with your new password.
        </p>
        <router-link
          to="/login"
          class="block w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded transition-colors text-center"
        >
          Go to Login
        </router-link>
      </div>

      <!-- Reset form -->
      <div v-else>
        <h1 class="text-2xl font-bold text-center mb-2 text-gray-100">Set New Password</h1>
        <p class="text-gray-400 text-center mb-8">Enter your new password below</p>

        <form @submit.prevent="handleSubmit">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input
              v-model="newPassword"
              type="password"
              required
              minlength="8"
              placeholder="At least 8 characters"
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-300 mb-1">Confirm Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              placeholder="Repeat your password"
              class="w-full px-3 py-2 border border-gray-700 rounded bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { authAPI } from '@/services/api'

const route = useRoute()
const token = route.params.token as string

const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const validating = ref(true)
const tokenValid = ref(false)
const success = ref(false)

onMounted(async () => {
  // Validate the token on mount
  try {
    const response = await authAPI.validateResetToken(token)
    tokenValid.value = response.data.valid
  } catch {
    tokenValid.value = false
  } finally {
    validating.value = false
  }
})

async function handleSubmit() {
  error.value = ''
  
  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }
  
  if (newPassword.value.length < 8) {
    error.value = 'Password must be at least 8 characters'
    return
  }
  
  loading.value = true
  
  try {
    await authAPI.resetPassword(token, newPassword.value)
    success.value = true
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to reset password. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>


