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
      ref="controlRightRef"
      :class="styles.root"
    >
      <slot />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useControlsMouseDetection } from '../../hooks/useControlsMouseDetection'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

/** 插槽 */
defineSlots<{
  /** 默认插槽 */
  default: () => void
}>()

const styles = {
  root: [
    'absolute inset-y-0 right-0 flex flex-col justify-end items-center gap-2 px-7 pb-2',
  ],
}

const { progressBar, controls } = usePlayerContext()

const controlRightRef = shallowRef<HTMLDivElement | null>(null)

useControlsMouseDetection(controlRightRef)

/** 显示/隐藏控制栏 */
const show = computed(() => {
  return controls.visible.value && !progressBar.isLongPressDragging.value
})
</script>
