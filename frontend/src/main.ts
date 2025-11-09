import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { theme } from './composables/useTheme'

// Initialize theme before mounting
theme.initTheme()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

