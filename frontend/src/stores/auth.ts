import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authAPI } from '@/services/api'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function register(email: string, password: string, name: string) {
    loading.value = true
    error.value = null
    try {
      const response = await authAPI.register(email, password, name)
      user.value = response.data.user
      token.value = response.data.token
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Registration failed'
      return false
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await authAPI.login(email, password)
      user.value = response.data.user
      token.value = response.data.token
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return true
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function restoreSession() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  async function refreshSession() {
    if (!token.value) return false
    
    try {
      const response = await authAPI.refresh()
      user.value = response.data.user
      token.value = response.data.token
      localStorage.setItem('auth_token', response.data.token)
      localStorage.setItem('auth_user', JSON.stringify(response.data.user))
      return true
    } catch (err: any) {
      console.error('Session refresh failed:', err)
      // If refresh fails, logout
      logout()
      return false
    }
  }

  function hasRole(role: User['roles'][0]): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  const isAuthenticated = () => !!user.value

  return {
    user,
    token,
    loading,
    error,
    register,
    login,
    logout,
    restoreSession,
    refreshSession,
    hasRole,
    isAuthenticated
  }
})

