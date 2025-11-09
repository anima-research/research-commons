<template>
  <div class="min-h-screen bg-gray-50 0">
    <!-- Fixed Top Pane -->
    <div class="fixed top-0 left-0 right-0 bg-white 0 border-b border-gray-200 0 z-30" ref="headerEl">
      <!-- Navigation Bar -->
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <button @click="router.push('/')" class="text-gray-600 0 hover:text-gray-900 0">
            ← Back to Browse
          </button>
          <div class="flex items-center gap-3">
            <button
              v-if="canDeleteSubmission"
              @click="handleDeleteSubmission"
              class="text-xs text-red-600 hover:text-red-700 px-2 py-1 border border-red-300 rounded hover:bg-red-50"
            >
              🗑️ Delete Submission
            </button>
            <div v-if="authStore.isAuthenticated()" class="text-sm text-gray-700 0">
              {{ authStore.user?.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Submission Header (Unscrollable) -->
      <div class="px-4 py-4 space-y-3">
        <!-- Title and badges -->
        <div class="flex items-start gap-3">
          <h1 class="text-xl font-bold flex-1">
            {{ submission?.title || 'Loading...' }}
          </h1>
          <span 
            v-if="submission?.source_type === 'arc-certified'"
            class="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium"
          >
            ✓ ARC Certified
          </span>
        </div>
        
        <!-- Meta info -->
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <span>by {{ submitterName }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatDate(submission?.submitted_at) }}</span>
        </div>
        
        <!-- Description (editable) -->
        <div class="relative">
          <div v-if="!editingDescription">
            <!-- Show description or prominent placeholder -->
            <div 
              v-if="submission?.metadata.description"
              class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded p-2 group cursor-text prose prose-sm max-w-none"
              @click="canEditSubmission && startEditDescription()"
            >
              <div v-html="renderMarkdown(submission.metadata.description)" class="inline"></div>
              <button
                v-if="canEditSubmission"
                @click.stop="startEditDescription"
                class="ml-2 text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✏️ Edit
              </button>
            </div>
            <button
              v-else-if="canEditSubmission"
              @click="startEditDescription"
              class="text-sm text-gray-400 hover:text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 rounded p-2 w-full text-left border border-dashed border-gray-300 dark:border-gray-600"
            >
              + Add description for this submission
            </button>
            <div v-else class="text-sm text-gray-400 italic">
              No description
            </div>
          </div>
          <div v-else class="space-y-2">
            <textarea
              v-model="descriptionEdit"
              ref="descriptionTextarea"
              @keyup.ctrl.enter="saveDescription"
              @keyup.meta.enter="saveDescription"
              @keyup.esc="cancelEditDescription"
              rows="3"
              class="w-full px-3 py-2 text-sm border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500 resize-none"
              placeholder="Describe what this conversation is about, what makes it interesting or noteworthy..."
            />
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500 dark:text-gray-400">Ctrl/⌘ + Enter to save, Esc to cancel</span>
              <div class="flex gap-2">
                <button @click="cancelEditDescription" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs rounded hover:bg-gray-50 dark:bg-gray-700">
                  Cancel
                </button>
                <button @click="saveDescription" class="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Research topic tags (editable with multiselect) -->
        <div class="relative group">
          <div class="flex flex-wrap gap-2 items-center">
            <span v-if="!submission?.metadata.tags || submission.metadata.tags.length === 0" class="text-xs text-gray-400">
              No research topics
            </span>
            <button
              v-for="tag in submission?.metadata.tags || []"
              :key="tag"
              @click="router.push(`/topics?tag=${tag}`)"
              class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded hover:bg-indigo-100"
            >
              #{{ tag }}
            </button>
            <button
              v-if="canEditSubmission"
              @click="showTopicSelector = true"
              class="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              ✏️ {{ submission?.metadata.tags?.length ? 'Edit' : 'Add' }} topics
            </button>
          </div>
        </div>
      </div>

      <!-- Two-column: Stats/Info | Actions -->
      <div class="px-4 pb-3 border-t border-gray-200 0">
        <div class="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-4 py-3">
          <!-- Left: Stats (compact) -->
          <div class="space-y-2">
            <!-- Rating Stats -->
            <div v-if="ratingStats.length > 0" class="space-y-1">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-600 0">⭐ Ratings:</span>
                <button
                  @click="showStatsDetail = true"
                  class="text-xs text-indigo-600 hover:text-indigo-700"
                >
