<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-950 transition-colors">
    <!-- Theme toggle (top right) -->
    <div class="absolute top-6 right-6">
      <ThemeToggle />
    </div>

    <!-- Hero Section -->
    <div class="container mx-auto px-4 pt-20 pb-16">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Research Commons
        </h1>
        <p class="text-xl text-gray-700 dark:text-gray-300 mb-4">
          A collaborative platform for studying AI model conversations
        </p>
        <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Upload conversations, annotate with structured tags, evaluate quality, 
          and discover patterns in how models communicate.
        </p>

        <!-- CTA Buttons -->
        <div class="flex gap-4 justify-center mb-16">
          <button
            @click="router.push('/browse')"
            class="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            Browse Conversations
          </button>
          <button
            @click="router.push(authStore.isAuthenticated() ? '/submit' : '/login')"
            class="px-8 py-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-700 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            {{ authStore.isAuthenticated() ? 'New Conversation' : 'Get Started' }}
          </button>
        </div>

        <!-- Feature Cards -->
        <div class="grid md:grid-cols-3 gap-6 mb-16">
          <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:scale-105">
            <div class="text-4xl mb-4">🏷️</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Collaborative Tagging</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Multiple researchers can vote on tags. Define custom ontologies for categorical analysis.
            </p>
          </div>

          <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:scale-105">
            <div class="text-4xl mb-4">⭐</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Quality Ratings</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Rate conversations using custom criteria. Track interview quality and model behavior.
            </p>
          </div>

          <div class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:scale-105">
            <div class="text-4xl mb-4">💬</div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Rich Discussion</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Comment on selections with Markdown support. Thread conversations about interesting patterns.
            </p>
          </div>
        </div>

        <!-- Why Section -->
        <div class="max-w-3xl mx-auto bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Why Research Commons?</h2>
          <div class="text-left space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              <strong class="text-indigo-600 dark:text-indigo-400">Model conversations</strong> reveal patterns we're just beginning to understand. 
              How do models respond to pressure? When do they hedge? What makes an interview elicit genuine behavior?
            </p>
            <p>
              This platform enables <strong>collaborative research</strong> on these questions. Upload conversations, 
              apply structured annotations, and build a shared understanding of model behavior.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Built by <a href="https://animalabs.ai" class="text-indigo-600 dark:text-indigo-400 hover:underline">Anima Labs</a> 
              for the model research community.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
      <div class="container mx-auto px-4 py-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            © 2025 Anima Labs. Open for research collaboration.
          </div>
          <div class="flex gap-6">
            <router-link to="/browse" class="hover:text-indigo-600 dark:hover:text-indigo-400">Browse</router-link>
            <router-link to="/topics" class="hover:text-indigo-600 dark:hover:text-indigo-400">Topics</router-link>
            <router-link to="/submit" class="hover:text-indigo-600 dark:hover:text-indigo-400">Submit</router-link>
            <router-link to="/login" class="hover:text-indigo-600 dark:hover:text-indigo-400">Login</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()
</script>

