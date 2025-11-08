<template>
  <div class="annotation-margin relative w-full" :style="{ minHeight: minHeight + 'px' }">
    <!-- Debug info -->
    <div class="absolute top-0 left-0 text-xs text-gray-400 bg-white p-2 z-50">
      {{ layoutPositions.length }} positioned
    </div>
    
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
      <!-- Connection line if displaced from anchor -->
      <svg
        v-if="Math.abs(pos.actualTop - pos.idealTop) > 5"
        class="absolute pointer-events-none"
        :style="{ 
          left: '-24px',
          width: '24px',
          height: Math.abs(pos.actualTop - pos.idealTop) + 50 + 'px',
          top: pos.idealTop < pos.actualTop ? '10px' : 'auto',
          bottom: pos.idealTop > pos.actualTop ? '10px' : 'auto'
        }"
      >
        <path
          :d="getConnectionPath(pos)"
          stroke="#CBD5E1" 
          stroke-width="1.5"
          stroke-dasharray="4 2"
          fill="none"
        />
      </svg>
      
      <!-- Render appropriate card type -->
      <CommentCard
        v-if="getAnnotation(pos.annotationId)?.type === 'comment'"
        :comment="getAnnotation(pos.annotationId).data"
        :user-name="getUserName(getAnnotation(pos.annotationId).data.author_id)"
        @resize="handleResize(pos.annotationId, $event)"
        @reply="$emit('reply-comment', getAnnotation(pos.annotationId).data.id)"
      />
      
      <RatingCard
        v-else-if="getAnnotation(pos.annotationId)?.type === 'rating'"
        :rating="getAnnotation(pos.annotationId).data"
        :criterion-name="getCriterionName(getAnnotation(pos.annotationId).data.criterion_id)"
        :user-name="getUserName(getAnnotation(pos.annotationId).data.rater_id)"
        @resize="handleResize(pos.annotationId, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AnnotationLayoutManager } from '@/utils/layout-manager'
import type { MarginAnnotation, LayoutPosition } from '@/utils/layout-manager'
import CommentCard from './CommentCard.vue'
import RatingCard from './RatingCard.vue'

interface Props {
  annotations: MarginAnnotation[]
  conversationEl: HTMLElement | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'reply-comment': [commentId: string]
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
  if (!props.conversationEl) {
    console.log('No conversation element for layout')
    return
  }
  
  console.log('Recalculating layout for', props.annotations.length, 'annotations')
  layoutManager.updateMessagePositions(props.conversationEl)
  
  // Update annotations with measured heights
  const annotationsWithHeights = props.annotations.map(ann => ({
    ...ann,
    minHeight: annotationHeights.value.get(ann.id) || ann.minHeight
  }))
  
  const positions = layoutManager.layoutAnnotations(annotationsWithHeights)
  console.log('Layout positions:', positions)
  layoutPositions.value = positions
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

function getConnectionPath(pos: LayoutPosition): string {
  const displacement = pos.actualTop - pos.idealTop
  
  if (Math.abs(displacement) < 5) return ''
  
  const startY = pos.height / 2
  const endY = startY - displacement
  const dx = 24
  
  if (displacement > 0) {
    // Annotation pushed down, line goes up to anchor
    return `M 0,${startY} C ${dx/3},${startY} ${dx*2/3},${endY} ${dx},${endY}`
  } else {
    // Annotation pushed up, line goes down to anchor
    return `M 0,${startY} C ${dx/3},${startY} ${dx*2/3},${endY} ${dx},${endY}`
  }
}
</script>

<style scoped>
.annotation-margin {
  position: relative;
}
</style>

