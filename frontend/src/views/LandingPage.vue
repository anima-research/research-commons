<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
    <!-- Hero Section -->
    <div class="container mx-auto px-6 pt-24 pb-20">
      <div class="max-w-5xl mx-auto">
        <!-- Logo and title -->
        <div class="flex items-center justify-center gap-4 mb-8">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-2xl">
            RC
          </div>
          <h1 class="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Research Commons
          </h1>
        </div>
        
        <p class="text-xl text-gray-300 text-center mb-4 max-w-3xl mx-auto">
          A collaborative platform for studying AI model conversations
        </p>
        <p class="text-base text-gray-400 text-center max-w-2xl mx-auto mb-12 leading-relaxed">
          Upload conversations, annotate with structured tags, evaluate quality, 
          and discover patterns in how models communicate.
        </p>

        <!-- CTA Buttons -->
        <div class="flex gap-3 justify-center mb-20">
          <button
            @click="router.push('/browse')"
            class="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-semibold text-sm shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Browse Conversations
          </button>
          <button
            @click="router.push(authStore.isAuthenticated() ? '/submit' : '/login')"
            class="px-6 py-3 bg-gray-800/50 hover:bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50 rounded-lg font-semibold text-sm shadow-lg transition-all hover:scale-105 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {{ authStore.isAuthenticated() ? 'New Conversation' : 'Get Started' }}
          </button>
        </div>

        <!-- Feature Cards -->
        <div class="grid md:grid-cols-3 gap-4 mb-16">
          <div class="group bg-gray-800/40 backdrop-blur-sm rounded-lg p-5 border border-gray-700/50 hover:border-indigo-500/50 transition-all">
            <div class="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-100 mb-2">Collaborative Tagging</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Multiple researchers can vote on tags. Define custom ontologies for categorical analysis.
            </p>
          </div>

          <div class="group bg-gray-800/40 backdrop-blur-sm rounded-lg p-5 border border-gray-700/50 hover:border-indigo-500/50 transition-all">
            <div class="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-100 mb-2">Quality Ratings</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Rate conversations using custom criteria. Track interview quality and model behavior.
            </p>
          </div>

          <div class="group bg-gray-800/40 backdrop-blur-sm rounded-lg p-5 border border-gray-700/50 hover:border-indigo-500/50 transition-all">
            <div class="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-100 mb-2">Rich Discussion</h3>
            <p class="text-sm text-gray-400 leading-relaxed">
              Comment on selections with Markdown support. Thread conversations about interesting patterns.
            </p>
          </div>
        </div>

        <!-- Why Section -->
        <div class="max-w-3xl mx-auto bg-gray-800/40 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
          <h2 class="text-2xl font-bold text-gray-100 mb-4">Why Research Commons?</h2>
          <div class="space-y-3 text-gray-300 text-sm leading-relaxed">
            <p>
              <strong class="text-indigo-400">Model conversations</strong> reveal patterns we're just beginning to understand. 
              How do models respond to pressure? When do they hedge? What makes an interview elicit genuine behavior?
            </p>
            <p>
              This platform enables <strong class="text-purple-400">collaborative research</strong> on these questions. Upload conversations, 
              apply structured annotations, and build a shared understanding of model behavior.
            </p>
            <p class="text-xs text-gray-500 pt-2 border-t border-gray-700/50">
              Built by <a href="https://animalabs.ai" class="text-indigo-400 hover:text-indigo-300 transition-colors">Anima Labs</a> 
              for the model research community.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
      <div class="container mx-auto px-6 py-6">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <div>
            © 2025 Anima Labs. Open for research collaboration.
          </div>
          <div class="flex gap-6">
            <router-link to="/browse" class="hover:text-indigo-400 transition-colors">Browse</router-link>
            <router-link to="/topics" class="hover:text-indigo-400 transition-colors">Topics</router-link>
            <router-link to="/submit" class="hover:text-indigo-400 transition-colors">Submit</router-link>
            <router-link to="/login" class="hover:text-indigo-400 transition-colors">Login</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
</script>

