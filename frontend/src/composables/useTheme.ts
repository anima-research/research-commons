import { ref } from 'vue'

// Singleton reactive state - always dark mode
const isDark = ref(true)

// Apply dark theme to DOM
function applyTheme() {
  document.documentElement.classList.add('dark')
  localStorage.setItem('theme', 'dark')
}

// Initialize - always dark mode
function initTheme() {
  isDark.value = true
  applyTheme()
}

// Deprecated - kept for compatibility but does nothing
function toggleTheme() {
  // No-op - dark mode only
}

// Deprecated - kept for compatibility but always sets dark
function setTheme(dark: boolean) {
  // Ignore parameter - always dark mode
  isDark.value = true
}

// Export singleton
export const theme = {
  isDark,
  toggleTheme,
  setTheme,
  initTheme
}

export function useTheme() {
  return theme
}

