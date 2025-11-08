<template>
  <div class="annotation-margin relative w-full" :style="{ minHeight: minHeight + 'px' }">
    <!-- Positioned annotation cards -->
    <div
      v-for="pos in layoutPositions"
      :key="pos.annotationId"
      class="absolute left-4 right-4 transition-all duration-300 ease-out"
      :style="{ 
        top: pos.actualTop + 'px',
        zIndex: 10 + pos.priority 
      }"
      :title="`Ideal: ${pos.idealTop}, Actual: ${pos.actualTop}`"
    >
      <!-- Connection lines showing extent to ideal position -->
      <svg
        class="absolute pointer-events-none"
        :style="{ 
          left: '-32px',
          top: '0',
          width: '32px',
          height: Math.max(pos.height, Math.abs(pos.idealTop - pos.actualTop) + pos.height) + 'px'
        }"
      >
        <!-- Top line: from top-left of card to ideal top position -->
        <path
          :d="getTopLinePath(pos)"
          stroke="#9CA3AF"
          stroke-width="1.5"
          stroke-dasharray="4 2"
          fill="none"
        />
        
        <!-- Bottom line: from bottom-left of card to ideal bottom position -->
        <path
          :d="getBottomLinePath(pos)"
          stroke="#9CA3AF"
          stroke-width="1.5"
          stroke-dasharray="4 2"
          fill="none"
        />
      </svg>
      
      <!-- Unified SelectionCard -->
      <SelectionCard
        v-if="getAnnotation(pos.annotationId)"
        :selection="getAnnotation(pos.annotationId)!.data.selection"
        :tags="getAnnotation(pos.annotationId)!.data.tags"
        :comments="getAnnotation(pos.annotationId)!.data.comments"
        :ratings="getAnnotation(pos.annotationId)!.data.ratings"
        :created-by="getUserName(getAnnotation(pos.annotationId)!.data.selection.created_by)"
        :user-names="userNames"
        :current-user-id="currentUserId"
        :can-delete="canModerate || getAnnotation(pos.annotationId)!.data.selection.created_by === currentUserId"
        :can-delete-comments="canModerate"
        :can-delete-ratings="canModerate"
        @resize="handleResize(pos.annotationId, $event)"
        @add-tag="$emit('add-tag', getAnnotation(pos.annotationId)!.data.selection.id)"
        @add-comment="$emit('add-comment', getAnnotation(pos.annotationId)!.data.selection.id)"
        @add-rating="$emit('add-rating', getAnnotation(pos.annotationId)!.data.selection.id)"
        @delete="$emit('delete-selection', getAnnotation(pos.annotationId)!.data.selection.id)"
        @delete-comment="$emit('delete-comment', $event)"
        @delete-rating="$emit('delete-rating', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AnnotationLayoutManager } from '@/utils/layout-manager'
import type { MarginAnnotation, LayoutPosition } from '@/utils/layout-manager'
import SelectionCard from './SelectionCard.vue'

interface Props {
  annotations: MarginAnnotation[]
  conversationEl: HTMLElement | null
  userNames?: Map<string, string>
  currentUserId?: string
  canModerate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userNames: () => new Map(),
  canModerate: false
})

const emit = defineEmits<{
  'add-tag': [selectionId: string]
  'add-comment': [selectionId: string]
  'add-rating': [selectionId: string]
  'delete-selection': [selectionId: string]
  'delete-comment': [commentId: string]
  'delete-rating': [ratingId: string]
}>()

const layoutManager = new AnnotationLayoutManager()
const layoutPositions = ref<LayoutPosition[]>([])
const annotationHeights = ref<Map<string, number>>(new Map())

// Calculate minimum height needed for all annotations
const minHeight = computed(() => {
  if (layoutPositions.value.length === 0) return 0
  const last = layoutPositions.value[layoutPositions.value.length - 1]
  return last.actualTop + last.height + 20
})

watch(() => props.annotations, () => {
  nextTick(() => recalculateLayout())
}, { deep: true })

watch(() => props.conversationEl, () => {
  nextTick(() => recalculateLayout())
})

onMounted(() => {
  window.addEventListener('resize', recalculateLayout)
  // Initial layout after mount - wait for DOM to be ready
  setTimeout(() => recalculateLayout(), 500)
  // Also recalculate periodically in case of changes
  const interval = setInterval(() => recalculateLayout(), 2000)
  
  onUnmounted(() => {
    clearInterval(interval)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', recalculateLayout)
})

function recalculateLayout() {
  if (!props.conversationEl) return
  
  layoutManager.updateMessagePositions(props.conversationEl)
  
  // Update annotations with measured heights
  const annotationsWithHeights = props.annotations.map(ann => ({
    ...ann,
    minHeight: annotationHeights.value.get(ann.id) || ann.minHeight
  }))
  
  layoutPositions.value = layoutManager.layoutAnnotations(annotationsWithHeights)
}

function handleResize(annotationId: string, height: number) {
  annotationHeights.value.set(annotationId, height)
  // Recalculate layout with new height
  nextTick(() => recalculateLayout())
}

function getAnnotation(id: string) {
  return props.annotations.find(a => a.id === id)
}

function getUserName(userId: string) {
  // Look up from auth store first
  const authStore = useAuthStore()
  if (authStore.user?.id === userId) {
    return authStore.user.name
  }
  // TODO: Look up other users from API
  return 'User ' + userId.substring(0, 8)
}

function getCriterionName(criterionId: string) {
  // TODO: Look up from criteria store
  return 'Criterion'
}

function getTopLinePath(pos: LayoutPosition): string {
  const startX = 32 // Right edge (card side)
  const startY = 0  // Top of card (actual)
  const endX = 0    // Left edge (conversation side)
  const endY = pos.idealTop - pos.actualTop // Ideal top (relative to card position)
  
  // If aligned, straight line
  if (Math.abs(endY) < 2) {
    return `M ${startX},${startY} L ${endX},${startY}`
  }
  
  // Curved path using cubic bezier
  return `M ${startX},${startY} C ${startX * 2/3},${startY} ${startX / 3},${endY} ${endX},${endY}`
}

function getBottomLinePath(pos: LayoutPosition): string {
  const startX = 32 // Right edge (card side)
  const startY = pos.height  // Bottom of card (actual)
  const endX = 0    // Left edge (conversation side)
  
  // Calculate where ideal bottom should be (relative to card)
  const idealMessageBottom = pos.idealBottom - pos.actualTop
  const endY = idealMessageBottom
  
  // If aligned, straight line
  if (Math.abs(endY - startY) < 2) {
    return `M ${startX},${startY} L ${endX},${startY}`
  }
  
  // Curved path
  return `M ${startX},${startY} C ${startX * 2/3},${startY} ${startX / 3},${endY} ${endX},${endY}`
}
</script>

<style scoped>
.annotation-margin {
  position: relative;
}
</style>

