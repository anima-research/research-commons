<template>
  <div 
    class="selection-card bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 hover:shadow-md transition-shadow"
    ref="cardEl"
  >
    <!-- Annotation header -->
    <div class="p-3 border-b border-gray-100">
      <div class="flex items-start gap-2">
        <span class="text-base flex-shrink-0">📌</span>
        <div class="flex-1 min-w-0">
          <div v-if="selection.label" class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {{ selection.label }}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ createdBy }} • {{ timeAgo }}
          </div>
        </div>
        <button
          v-if="canDelete"
          @click="$emit('delete')"
          class="text-red-500 hover:text-red-700 text-xs p-1"
          title="Delete annotation"
        >
          🗑️
        </button>
      </div>
    </div>

    <!-- Tags section -->
    <div v-if="groupedTags.length > 0 || canTag" class="p-3 border-b border-gray-100 dark:border-gray-800">
      <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">🏷️ Tags</div>
      <div class="flex flex-wrap gap-2 mb-2">
        <div
          v-for="group in groupedTags"
          :key="group.tag.id"
          class="group relative"
        >
          <button
            @click="toggleMyVote(group.tag.id)"
            class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all hover:scale-105"
            :style="{ 
              backgroundColor: group.tag.color + (group.hasMyVote ? '30' : '15'),
              color: group.tag.color,
              outline: group.hasMyVote ? `2px solid ${group.tag.color}` : 'none',
              outlineOffset: '-2px'
            }"
            :title="getGroupTooltip(group)"
          >
            {{ group.tag.name }}
            <span v-if="group.count > 1" class="text-[10px] font-bold opacity-75 bg-white dark:bg-gray-900 px-1 rounded">
              ×{{ group.count }}
            </span>
            <span class="text-[10px] opacity-60">
              {{ group.hasMyVote ? '(voted)' : '' }}
            </span>
          </button>
          <!-- Contributors tooltip on hover -->
          <div class="absolute left-0 top-full mt-1 hidden group-hover:block z-10 bg-gray-900 dark:bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            {{ getContributorsList(group) }}
            <div class="text-[10px] opacity-75 mt-0.5">
              Click to {{ group.hasMyVote ? 'remove' : 'add' }} your vote
            </div>
          </div>
        </div>
      </div>
      <button 
        v-if="canTag"
        @click="$emit('add-tag')"
        class="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
      >
        + Add tag
      </button>
    </div>

    <!-- Comments section -->
    <div v-if="comments.length > 0 || canComment" class="p-3 border-b border-gray-100">
      <div class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
        💬 Comments ({{ comments.length }})
      </div>
      
      <div v-if="comments.length > 0" class="space-y-2 mb-2">
        <div
          v-for="comment in displayedComments"
          :key="comment.id"
          class="text-sm bg-gray-50 dark:bg-gray-950 rounded p-2 group relative"
        >
          <div class="flex items-baseline gap-2 mb-1">
            <span class="font-medium text-gray-700 dark:text-gray-300">{{ getUserName(comment.author_id) }}</span>
            <span class="text-xs text-gray-400">{{ formatTime(comment.created_at) }}</span>
            <button
              v-if="canDeleteComments || comment.author_id === currentUserId"
              @click="$emit('delete-comment', comment.id)"
              class="ml-auto text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 text-xs"
              title="Delete comment"
            >
              🗑️
            </button>
          </div>
          <div class="text-gray-800 prose prose-sm max-w-none" v-html="renderMarkdown(comment.content)" />
        </div>
        
        <button 
          v-if="comments.length > 2 && !showAllComments"
          @click="showAllComments = true"
          class="text-xs text-indigo-600 hover:text-indigo-700"
        >
          Show {{ comments.length - 2 }} more...
        </button>
      </div>
      
      <button 
        v-if="canComment"
        @click="$emit('add-comment')"
        class="text-xs text-indigo-600 hover:text-indigo-700"
      >
        + Add comment
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { Selection, Comment, Rating } from '@/types'
import type { AnnotationTag } from '@/types/ontology'
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  selection: Selection
  tags: AnnotationTag[]
  comments: Comment[]
  tagAttributions?: Array<{ tag_id: string; tagged_by: string; tagged_at: Date }>
  createdBy?: string
  canTag?: boolean
  canComment?: boolean
  canDelete?: boolean
  canDeleteComments?: boolean
  canRemoveTags?: boolean
  userNames?: Map<string, string>  // userId -> name mapping
  currentUserId?: string
}

const props = withDefaults(defineProps<Props>(), {
  createdBy: 'User',
  canTag: true,
  canComment: true,
  canDelete: false,
  canDeleteComments: false,
  canRemoveTags: false,
  tagAttributions: () => []
})

const emit = defineEmits<{
  'add-tag': []
  'add-tag-vote': [tagId: string]
  'add-comment': []
  'delete': []
  'delete-comment': [commentId: string]
  'remove-tag': [tagId: string]
  'resize': [height: number]
}>()

const cardEl = ref<HTMLElement>()
const showAllComments = ref(false)

const timeAgo = computed(() => {
  const date = new Date(props.selection.created_at)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
})

const displayedComments = computed(() => {
  return showAllComments.value ? props.comments : props.comments.slice(0, 2)
})

// Group tags by tag_id and count votes
const groupedTags = computed(() => {
  const groups = new Map<string, { 
    tag: any; 
    contributors: Array<{ userId: string; timestamp: Date }>;
    hasMyVote: boolean;
  }>()
  
  // Group by tag
  props.tags.forEach(tag => {
    const attributions = (props.tagAttributions || []).filter(a => a.tag_id === tag.id)
    
    if (!groups.has(tag.id)) {
      groups.set(tag.id, {
        tag,
        contributors: attributions.map(a => ({ userId: a.tagged_by, timestamp: a.tagged_at })),
        hasMyVote: attributions.some(a => a.tagged_by === props.currentUserId)
      })
    }
  })
  
  return Array.from(groups.values()).map(g => ({
    tag: g.tag,
    count: g.contributors.length,
    contributors: g.contributors,
    hasMyVote: g.hasMyVote
  }))
})

function getUserName(userId: string) {
  if (props.userNames?.has(userId)) {
    return props.userNames.get(userId)!
  }
  return 'User ' + userId.substring(0, 8)
}

function getTagAuthor(tagId: string): string {
  const attribution = props.tagAttributions?.find(a => a.tag_id === tagId)
  if (!attribution) return '?'
  return props.userNames?.get(attribution.tagged_by) || 'User'
}

function getTagAttribution(tagId: string): string {
  const attribution = props.tagAttributions?.find(a => a.tag_id === tagId)
  if (!attribution) return 'Tagged by unknown'
  const author = props.userNames?.get(attribution.tagged_by) || 'User'
  return `Tagged by ${author}`
}

function canRemoveTag(tagId: string): boolean {
  if (props.canRemoveTags) return true // Moderators can remove any
  const attribution = props.tagAttributions?.find(a => a.tag_id === tagId)
  return attribution?.tagged_by === props.currentUserId
}

function getGroupTooltip(group: any): string {
  if (group.count === 1) {
    const userName = getUserName(group.contributors[0].userId)
    return `Tagged by ${userName}`
  }
  return `${group.count} votes - click to see details`
}

function getContributorsList(group: any): string {
  const names = group.contributors.map((c: any) => getUserName(c.userId))
  if (names.length <= 3) {
    return names.join(', ')
  }
  return `${names.slice(0, 3).join(', ')} +${names.length - 3} more`
}

function toggleMyVote(tagId: string) {
  const group = groupedTags.value.find(g => g.tag.id === tagId)
  if (!group) return
  
  if (group.hasMyVote) {
    // Remove my vote
    emit('remove-tag', tagId)
  } else {
    // Add my vote - need to emit tag-vote event
    emit('add-tag-vote', tagId)
  }
}

function getCriterionName(criterionId: string) {
  // TODO: Look up criterion name from store
  return 'Criterion ' + criterionId.substring(0, 8)
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  return date.toLocaleDateString()
}

watch(() => cardEl.value?.offsetHeight, (height) => {
  if (height) {
    emit('resize', height)
  }
})

onMounted(() => {
  if (cardEl.value) {
    emit('resize', cardEl.value.offsetHeight)
  }
})
</script>

<style scoped>
.selection-card {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>

