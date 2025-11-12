<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        @click="$emit('cancel')"
      />
    </transition>
    
    <!-- Side panel -->
    <transition name="slide-left">
      <div
        v-if="show"
        class="fixed right-0 top-0 bottom-0 w-[480px] bg-gray-900/95 backdrop-blur-xl border-l border-gray-700/50 shadow-2xl z-50 flex flex-col"
        @click.stop
      >
        <!-- Compact header -->
        <div class="px-4 py-3 border-b border-gray-700/50 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <h3 class="text-sm font-semibold text-gray-100">Rate Conversation</h3>
            <span class="text-xs text-gray-500">Auto-saved</span>
          </div>
          <button
            @click="$emit('cancel')"
            class="text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-3 space-y-3">
          <div v-if="rankingSystemsWithCriteria.length === 0" class="text-center py-12 text-gray-500">
            <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p class="text-sm">No rating systems available</p>
          </div>

          <!-- Ranking systems -->
          <div v-else class="space-y-3">
            <div
              v-for="system in rankingSystemsWithCriteria"
              :key="system.system.id"
              class="rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden"
            >
              <!-- System header -->
              <div class="px-3 py-2 bg-gray-800/80 border-b border-gray-700/50 flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-semibold text-gray-100 truncate">{{ system.system.name }}</h4>
                  <p class="text-xs text-gray-400 mt-0.5 line-clamp-1">{{ system.system.description }}</p>
                </div>
                <span
                  v-if="system.isFromTopic"
                  class="ml-2 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-medium rounded flex items-center gap-1 shrink-0"
                  title="From research topic (required)"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
                  </svg>
                  Topic
                </span>
              </div>

              <!-- Criteria -->
              <div class="p-2 space-y-2">
                <div
                  v-for="criterion in system.criteria"
                  :key="criterion.id"
                  class="flex items-stretch gap-2"
                >
                  <!-- Criterion info -->
                  <div class="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div class="text-xs font-medium text-gray-200">{{ criterion.name }}</div>
                    <div class="text-[11px] text-gray-500 leading-tight">{{ criterion.description }}</div>
                  </div>
                  
                  <!-- Discrete rating bar (full height) -->
                  <div class="w-32 shrink-0">
                    <RatingBar
                      v-model="ratings[criterion.id]"
                      :min="criterion.scale_min!"
                      :max="criterion.scale_max!"
                      @update:model-value="autoSaveRating(criterion.id)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Criterion, RankingSystem } from '@/types/ranking'
import RatingBar from './RatingBar.vue'

interface Props {
  show: boolean
  rankingSystemsWithCriteria: Array<{
    system: RankingSystem
    criteria: Criterion[]
    isFromTopic: boolean
  }>
  existingRatings?: Array<{
    criterion_id: string
    score: number
  }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'submit': [ratings: Array<{ criterion_id: string; score: number }>]
  'cancel': []
}>()

const ratings = ref<Record<string, number | null>>({})

watch(() => props.show, (show) => {
  if (show) {
    // Initialize with existing ratings or null
    ratings.value = {}
    
    // First set all to null
    for (const system of props.rankingSystemsWithCriteria) {
      for (const criterion of system.criteria) {
        ratings.value[criterion.id] = null
      }
    }
    
    // Then load existing ratings
    if (props.existingRatings) {
      for (const rating of props.existingRatings) {
        ratings.value[rating.criterion_id] = rating.score
      }
    }
  }
})

// Auto-save individual rating on change
function autoSaveRating(criterionId: string) {
  const score = ratings.value[criterionId]
  if (score !== null && score !== undefined) {
    emit('submit', [{ criterion_id: criterionId, score }])
  }
}
</script>

<style scoped>
/* Slide from right */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease-out;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}

/* Fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
