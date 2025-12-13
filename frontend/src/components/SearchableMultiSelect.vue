<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger button -->
    <button
      @click="isOpen = !isOpen"
      class="px-3 py-1.5 pr-7 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-lg text-gray-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center gap-1.5 min-w-[100px]"
      :class="{ 'ring-2 ring-indigo-500': isOpen }"
    >
      <span v-if="modelValue.length === 0" class="text-gray-400">{{ placeholder }}</span>
      <span v-else-if="modelValue.length === 1" class="truncate max-w-[120px]">{{ getLabel(modelValue[0]) }}</span>
      <span v-else class="text-indigo-300">{{ modelValue.length }} selected</span>
      <svg class="w-3 h-3 absolute right-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
        :style="dropdownStyle"
      >
        <!-- Search input -->
        <div class="p-2 border-b border-gray-700">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            :placeholder="`Search ${label.toLowerCase()}...`"
            class="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded text-xs text-gray-200 placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-transparent"
            @keydown.escape="isOpen = false"
          />
        </div>

        <!-- Options list -->
        <div class="max-h-48 overflow-y-auto">
          <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-xs text-gray-500">
            No matches found
          </div>
          <label
            v-for="option in filteredOptions"
            :key="option.value"
            class="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-700/50 cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              :checked="modelValue.includes(option.value)"
              @change="toggleOption(option.value)"
              class="w-3 h-3 rounded border-gray-600 bg-gray-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
            />
            <span class="text-xs text-gray-200 truncate flex-1">{{ option.label }}</span>
            <span v-if="option.badge" class="text-[9px] px-1 py-0.5 rounded bg-gray-700 text-gray-400">
              {{ option.badge }}
            </span>
          </label>
        </div>

        <!-- Footer -->
        <div v-if="modelValue.length > 0" class="p-2 border-t border-gray-700 flex justify-between">
          <button
            @click="$emit('update:modelValue', [])"
            class="text-[10px] text-gray-400 hover:text-gray-200 transition-colors"
          >
            Clear all
          </button>
          <span class="text-[10px] text-gray-500">{{ modelValue.length }} selected</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

interface Option {
  value: string
  label: string
  badge?: string
}

interface Props {
  modelValue: string[]
  options: Option[]
  placeholder?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Select...',
  label: 'items'
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const containerRef = ref<HTMLElement>()
const dropdownRef = ref<HTMLElement>()
const searchInputRef = ref<HTMLInputElement>()

const dropdownStyle = ref<Record<string, string>>({})

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return props.options
  const query = searchQuery.value.toLowerCase()
  return props.options.filter(opt => 
    opt.label.toLowerCase().includes(query) ||
    opt.value.toLowerCase().includes(query)
  )
})

function getLabel(value: string): string {
  const opt = props.options.find(o => o.value === value)
  return opt?.label || value
}

function toggleOption(value: string) {
  const newValue = props.modelValue.includes(value)
    ? props.modelValue.filter(v => v !== value)
    : [...props.modelValue, value]
  emit('update:modelValue', newValue)
}

function updateDropdownPosition() {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  dropdownStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    minWidth: `${Math.max(rect.width, 200)}px`
  }
}

function handleClickOutside(e: MouseEvent) {
  if (
    containerRef.value && !containerRef.value.contains(e.target as Node) &&
    dropdownRef.value && !dropdownRef.value.contains(e.target as Node)
  ) {
    isOpen.value = false
  }
}

watch(isOpen, async (open) => {
  if (open) {
    updateDropdownPosition()
    await nextTick()
    searchInputRef.value?.focus()
  } else {
    searchQuery.value = ''
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', updateDropdownPosition, true)
  window.addEventListener('resize', updateDropdownPosition)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', updateDropdownPosition, true)
  window.removeEventListener('resize', updateDropdownPosition)
})
</script>


