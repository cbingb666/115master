<template>
  <span
    ref="triggerRef"
    class="inline-flex"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
  </span>
  <Teleport to="#my-app">
    <div
      v-if="visible"
      :class="`tooltip tooltip-${placement} tooltip-open pointer-events-none fixed z-10000`"
      :data-tip="content"
      :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` }"
    />
  </Teleport>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type Placement = 'top' | 'bottom'

/**
 * Portal tooltip：气泡复用 daisyUI 的 .tooltip 伪元素（视觉与其他 tooltip 完全一致），
 * 通过 Teleport 到 #my-app + fixed 定位绕开父级 overflow / sticky stacking 裁切。
 * 实现上渲染一个与 trigger 同尺寸的透明 .tooltip 占位 div，daisyUI 伪元素相对它定位。
 */
defineProps({
  content: { type: String, default: '' },
  placement: { type: String as PropType<Placement>, default: 'bottom' },
})

const triggerRef = ref<HTMLElement>()
const visible = ref(false)
const rect = ref({ x: 0, y: 0, w: 0, h: 0 })
let showTimer: ReturnType<typeof setTimeout> | undefined
let hideTimer: ReturnType<typeof setTimeout> | undefined

function place() {
  if (!triggerRef.value)
    return
  const r = triggerRef.value.getBoundingClientRect()
  rect.value = { x: r.left, y: r.top, w: r.width, h: r.height }
}

function show() {
  clearTimeout(hideTimer)
  showTimer = setTimeout(() => {
    visible.value = true
    nextTick(place)
  }, 100)
}

function hide() {
  clearTimeout(showTimer)
  hideTimer = setTimeout(() => visible.value = false, 100)
}

watch(visible, (value) => {
  if (value) {
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return
  }
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})

onBeforeUnmount(() => {
  clearTimeout(showTimer)
  clearTimeout(hideTimer)
  window.removeEventListener('resize', place)
  window.removeEventListener('scroll', place, true)
})
</script>
