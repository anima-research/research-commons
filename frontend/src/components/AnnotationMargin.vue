<template>
  <div class="annotation-margin-container flex relative" :style="{ minHeight: minHeight + 'px' }">
    <!-- Vertical bars column (narrow, left side) -->
    <div class="vertical-bars-column relative" style="width: 24px; flex-shrink: 0;">
      <div
        v-for="barPos in verticalBarPositions"
        :key="barPos.barId"
        class="absolute left-1/2 -translate-x-1/2 rounded-full transition-all duration-300"
        :style="{
          top: barPos.top + 'px',
          height: barPos.height + 'px',
          width: '4px',
          backgroundColor: barPos.color,
          opacity: 0.6
        }"
      />
    </div>

    <!-- Annotations column (labels and cards) -->
    <div class="annotations-column relative flex-1 pl-2">
      <!-- Positioned annotation elements -->
      <div
        v-for="pos in layoutPositions"
        :key="pos.annotationId"
        class="absolute left-4 right-4 transition-all duration-300 ease-out"
        :style="{ 
          top: pos.actualTop + 'px',
          zIndex: 10 + pos.priority 
        }"
      >
        <!-- Connector line (only for displaced tag labels) -->
        <svg
          v-if="shouldShowConnector(pos)"
          class="absolute pointer-events-none"
          :style="{ 
            left: '-28px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: getConnectorWidth(pos) + 'px',
            height: '2px'
          }"
        >
          <line
            x1="0"
            :x2="getConnectorWidth(pos)"
            y1="1"
            y2="1"
            stroke="#6B7280"
            stroke-width="1"
            stroke-dasharray="2 2"
          />
        </svg>

        <!-- Tag label -->
        <TagAnnotationBar
          v-if="getAnnotation(pos.annotationId)?.type === 'tag-label'"
          :tag="getAnnotation(pos.annotationId)!.data.tag"
          :tag-attributions="getAnnotation(pos.annotationId)!.data.tagAttributions"
          :user-names="userNames"
          :current-user-id="currentUserId"
          @resize="handleResize(pos.annotationId, $event)"
          @add-vote="$emit('add-tag-vote', getAnnotation(pos.annotationId)!.data.selectionId, getAnnotation(pos.annotationId)!.data.tag.id)"
          @remove-vote="$emit('remove-tag', getAnnotation(pos.annotationId)!.data.selectionId, getAnnotation(pos.annotationId)!.data.tag.id)"
        />

        <!-- Comment card -->
        <CommentCard
          v-else-if="getAnnotation(pos.annotationId)?.type === 'comment-card'"
          :comment="getAnnotation(pos.annotationId)!.data.comment"
          :selection="getAnnotation(pos.annotationId)!.data.selection"
          :created-by="getUserName(getAnnotation(pos.annotationId)!.data.comment.author_id)"
          :can-delete="canModerate || getAnnotation(pos.annotationId)!.data.comment.author_id === currentUserId"
          :is-reply="getAnnotation(pos.annotationId)!.data.isReply"
          :depth="getAnnotation(pos.annotationId)!.data.depth || 0"
          @resize="handleResize(pos.annotationId, $event)"
          @delete="$emit('delete-comment', getAnnotation(pos.annotationId)!.data.comment.id)"
          @reply="$emit('reply-to-comment', getAnnotation(pos.annotationId)!.data.selectionId, getAnnotation(pos.annotationId)!.data.comment.id)"
        />

        <!-- Expand replies button -->
        <button
          v-else-if="getAnnotation(pos.annotationId)?.type === 'expand-replies'"
          @click="$emit('expand-replies', getAnnotation(pos.annotationId)!.data.parentCommentId)"
          class="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 py-1"
          :style="{ marginLeft: (getAnnotation(pos.annotationId)!.data.depth || 1) * 12 + 'px' }"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ getAnnotation(pos.annotationId)!.data.hiddenCount }} more {{ getAnnotation(pos.annotationId)!.data.hiddenCount === 1 ? 'reply' : 'replies' }}
        </button>

        <!-- Expand top-level comments button -->
        <button
          v-else-if="getAnnotation(pos.annotationId)?.type === 'expand-top-level'"
          @click="$emit('expand-top-level', getAnnotation(pos.annotationId)!.data.selectionId)"
          class="text-xs text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1 py-1"
        >
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
          {{ getAnnotation(pos.annotationId)!.data.hiddenCount }} more {{ getAnnotation(pos.annotationId)!.data.hiddenCount === 1 ? 'comment' : 'comments' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { AnnotationLayoutManager } from '@/utils/layout-manager'
import type { MarginAnnotation, LayoutPosition, VerticalBar, VerticalBarPosition } from '@/utils/layout-manager'
import TagAnnotationBar from './TagAnnotationBar.vue'
import CommentCard from './CommentCard.vue'

interface Props {
  annotations: MarginAnnotation[]
  verticalBars: VerticalBar[]
  conversationEl: HTMLElement | null
  userNames?: Map<string, string>
  currentUserId?: string
  canModerate?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  userNames: () => new Map(),
  canModerate: false,
  verticalBars: () => []
})

const emit = defineEmits<{
  'add-tag-vote': [selectionId: string, tagId: string]
  'remove-tag': [selectionId: string, tagId: string]
  'delete-comment': [commentId: string]
  'reply-to-comment': [selectionId: string, parentCommentId: string]
  'expand-replies': [parentCommentId: string]
  'expand-top-level': [selectionId: string]
}>()

const layoutManager = new AnnotationLayoutManager()
const layoutPositions = ref<LayoutPosition[]>([])
const verticalBarPositions = ref<VerticalBarPosition[]>([])
const annotationHeights = ref<Map<string, number>>(new Map())

// Calculate minimum height needed for all content
const minHeight = computed(() => {
  let maxBottom = 0
  
  // Check annotation positions
  if (layoutPositions.value.length > 0) {
    const last = layoutPositions.value[layoutPositions.value.length - 1]
    maxBottom = Math.max(maxBottom, last.actualTop + last.height + 20)
  }
  
  // Check vertical bar positions
  for (const barPos of verticalBarPositions.value) {
    maxBottom = Math.max(maxBottom, barPos.top + barPos.height + 20)
  }
  
  return maxBottom
})

watch(() => [props.annotations, props.verticalBars], () => {
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
  
  // Layout vertical bars
  verticalBarPositions.value = layoutManager.layoutVerticalBars(props.verticalBars)
  
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
  const authStore = useAuthStore()
  if (authStore.user?.id === userId) {
    return authStore.user.name
  }
  return props.userNames.get(userId) || 'User ' + userId.substring(0, 8)
}

function shouldShowConnector(pos: LayoutPosition): boolean {
  const ann = getAnnotation(pos.annotationId)
  if (ann?.type !== 'tag-label') return false
  
  // Show connector if label is displaced from ideal position
  const displacement = Math.abs(pos.actualTop - pos.idealTop)
  return displacement > 10  // Show if displaced by more than 10px
}

function getConnectorWidth(pos: LayoutPosition): number {
  // Connector spans the gap between vertical bar and label
  return 24  // Width of vertical bar column minus some padding
}
</script>

<style scoped>
.annotation-margin-container {
  position: relative;
}
</style>
