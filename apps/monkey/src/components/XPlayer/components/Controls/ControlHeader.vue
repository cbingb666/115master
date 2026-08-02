<template>
  <transition
    enter-active-class="transition-all duration-300 ease-[var(--ui-ease-enter)]"
    leave-active-class="transition-all duration-300 ease-[var(--ui-ease-exit)]"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      ref="controlHeaderRef"
      :class="[styles.root]"
    >
      <div :class="styles.bg" />
      <div
        :class="[
          styles.content.root,
        ]"
      >
        <slot name="left" />
        <slot name="right" />
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useControlsMouseDetection } from '@/components/XPlayer/hooks/useControlsMouseDetection'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

/** 插槽 */
defineSlots<{
  /** 头部左侧插槽 */
  left: () => void
  /** 头部右侧插槽 */
  right: () => void
}>()

const { controls } = usePlayerContext()

const styles = clsx({
  root: [
    'relative',
    'transform-gpu',
  ],
  content: {
    root: 'relative flex items-start justify-between p-6',
  },
  bg: [
    'absolute inset-0 bottom-[-200%]',
    'bg-[linear-gradient(to_bottom,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.32)_22%,rgba(0,0,0,0.26)_32%,rgba(0,0,0,0.20)_42%,rgba(0,0,0,0.14)_52%,rgba(0,0,0,0.08)_62%,rgba(0,0,0,0.03)_72%,rgba(0,0,0,0)_100%)]',
    'pointer-events-none',
  ],
})

const controlHeaderRef = shallowRef<HTMLDivElement | null>(null)

useControlsMouseDetection(controlHeaderRef)

/** 显示/隐藏控制栏 */
const show = computed(() => {
  return controls.visible.value
})
</script>
