import { ref, watch } from 'vue'

// Singleton reactive state
const isDark = ref(false)

// Apply theme to DOM
function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
  }
}

// Watch for changes and update DOM + localStorage
watch(isDark, (dark) => {
  applyTheme(dark)
}, { immediate: false })

// Initialize from localStorage or system preference
function initTheme() {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    // Check system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  // Apply immediately without triggering watcher
  applyTheme(isDark.value)
}

// Toggle function
function toggleTheme() {
  isDark.value = !isDark.value
}

// Set theme explicitly
function setTheme(dark: boolean) {
  isDark.value = dark
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

