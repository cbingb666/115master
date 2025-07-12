<template>
  <transition
    enter-active-class="transition-all duration-200 ease-out"
    leave-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      ref="controlHeaderRef"
      :class="[styles.root]"
    >
      <div :class="[styles.bg]" />
      <div
        :class="[
          styles.content.root,
        ]"
      >
        <slot name="left" />
        <div :class="[styles.content.left]">
          {{ props.title }}
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useControlsMouseDetection } from '../../hooks/useControlsMouseDetection'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

const props = defineProps<{
  title?: string
}>()

/** 插槽 */
defineSlots<{
  /** 头部左侧插槽 */
  left: () => void
}>()

const { controls, progressBar } = usePlayerContext()

const styles = {
  root: 'relative',
  content: {
    root: 'relative flex justify-between items-center p-7',
    left: 'flex-1 font-bold',
    right: {
      root: 'flex-1',
      item: 'flex justify-end gap-2',
    },
  },
  bg: 'absolute inset-0 bottom-[-50px] bg-linear-to-b from-black/30 to-transparent pointer-events-none',
}

const controlHeaderRef = shallowRef<HTMLDivElement | null>(null)

useControlsMouseDetection(controlHeaderRef)

/** 显示/隐藏控制栏 */
const show = computed(() => {
  return controls.visible.value && !progressBar.isLongPressDragging.value
})
</script>
