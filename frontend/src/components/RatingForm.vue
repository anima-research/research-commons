<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="$emit('cancel')"
    >
      <div class="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        <div class="p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold">⭐ Rate Selection</h3>
          <p class="text-sm text-gray-600 mt-1">Rate against available criteria from attached ranking systems</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <div v-if="rankingSystemsWithCriteria.length === 0" class="text-center py-8 text-gray-500">
            No ranking systems attached to this submission.
          </div>

          <div v-else class="space-y-6">
            <div
              v-for="system in rankingSystemsWithCriteria"
              :key="system.system.id"
              class="border border-gray-200 rounded-lg p-4"
            >
              <div class="flex items-start gap-2 mb-4">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900">{{ system.system.name }}</h4>
                  <p class="text-xs text-gray-600 mt-1">{{ system.system.description }}</p>
                </div>
                <span
                  v-if="system.isFromTopic"
                  class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded flex items-center gap-1"
                  title="From research topic (required)"
                >
                  🔒
                </span>
              </div>

              <div class="space-y-3">
                <div
                  v-for="criterion in system.criteria"
                  :key="criterion.id"
                  class="bg-gray-50 rounded p-3"
                >
                  <div class="flex items-start justify-between mb-2">
                    <div class="flex-1">
                      <div class="font-medium text-sm text-gray-900">{{ criterion.name }}</div>
                      <div class="text-xs text-gray-600 mt-1">{{ criterion.description }}</div>
                    </div>
                    <div class="text-sm text-gray-500">
                      {{ criterion.scale_min }}-{{ criterion.scale_max }}
                    </div>
                  </div>

                  <!-- Rating input -->
                  <div class="flex items-center gap-2 mt-3">
                    <input
                      v-model.number="ratings[criterion.id]"
                      type="range"
                      :min="criterion.scale_min"
                      :max="criterion.scale_max"
                      :step="1"
                      class="flex-1"
                    />
                    <input
                      v-model.number="ratings[criterion.id]"
                      type="number"
                      :min="criterion.scale_min"
                      :max="criterion.scale_max"
                      class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 border-t border-gray-200 flex justify-between items-center">
          <div class="text-sm text-gray-600">
            {{ ratingCount }} rating(s) entered
          </div>
          <div class="flex gap-2">
            <button
              @click="$emit('cancel')"
              class="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              @click="submitRatings"
              :disabled="ratingCount === 0"
              class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Submit {{ ratingCount }} Rating(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Criterion, RankingSystem, SubmissionRankingSystem } from '@/types/ranking'

interface Props {
  show: boolean
  rankingSystemsWithCriteria: Array<{
    system: RankingSystem
    criteria: Criterion[]
    isFromTopic: boolean
  }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'submit': [ratings: Array<{ criterion_id: string; score: number }>]
  'cancel': []
}>()

const ratings = ref<Record<string, number>>({})

watch(() => props.show, (show) => {
  if (show) {
    // Initialize with default mid-range values
    ratings.value = {}
    for (const system of props.rankingSystemsWithCriteria) {
      for (const criterion of system.criteria) {
        const mid = Math.floor((criterion.scale_min! + criterion.scale_max!) / 2)
        ratings.value[criterion.id] = mid
      }
    }
  }
})

const ratingCount = computed(() => {
  return Object.keys(ratings.value).length
})

function submitRatings() {
  const ratingsList = Object.entries(ratings.value).map(([criterion_id, score]) => ({
    criterion_id,
    score
  }))
  
  emit('submit', ratingsList)
  ratings.value = {}
}
</script>

