<template>
  <span 
    v-if="visibility && visibility !== 'public'"
    :class="badgeClasses"
    :title="badgeTitle"
  >
    <component :is="badgeIcon" class="w-2.5 h-2.5" />
    <span v-if="showLabel" class="ml-1">{{ badgeLabel }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import type { VisibilityLevel } from '@/types'

interface Props {
  visibility?: VisibilityLevel
  showLabel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showLabel: false
})

const badgeClasses = computed(() => {
  const base = 'inline-flex items-center px-1.5 py-0.5 text-[10px] rounded font-medium'
  
  switch (props.visibility) {
    case 'pending':
      return `${base} bg-amber-500/20 border border-amber-500/30 text-amber-400`
    case 'admin-only':
      return `${base} bg-red-500/20 border border-red-500/30 text-red-400`
    case 'researcher':
      return `${base} bg-purple-500/20 border border-purple-500/30 text-purple-400`
    case 'public':
    default:
      return `${base} bg-green-500/20 border border-green-500/30 text-green-400`
  }
})

const badgeLabel = computed(() => {
  switch (props.visibility) {
    case 'pending':
      return 'Pending'
    case 'admin-only':
      return 'Admin'
    case 'researcher':
      return 'Researcher'
    case 'public':
    default:
      return 'Public'
  }
})

const badgeTitle = computed(() => {
  switch (props.visibility) {
    case 'pending':
      return 'Awaiting review - only visible to admins'
    case 'admin-only':
      return 'Admin only - restricted visibility'
    case 'researcher':
      return 'Visible to researchers and admins'
    case 'public':
    default:
      return 'Visible to everyone'
  }
})

// Simple SVG icon components
const PendingIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z', 'clip-rule': 'evenodd' })
])

const AdminIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z', 'clip-rule': 'evenodd' })
])

const ResearcherIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { d: 'M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z' })
])

const PublicIcon = () => h('svg', { fill: 'currentColor', viewBox: '0 0 20 20' }, [
  h('path', { 'fill-rule': 'evenodd', d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z', 'clip-rule': 'evenodd' })
])

const badgeIcon = computed(() => {
  switch (props.visibility) {
    case 'pending':
      return PendingIcon
    case 'admin-only':
      return AdminIcon
    case 'researcher':
      return ResearcherIcon
    case 'public':
    default:
      return PublicIcon
  }
})
</script>

