<template>
  <div
    v-if="visible"
    :class="[styles.container, animationClass]"
  >
    <Icon :name="isShowPause ? I.PAUSE : I.PLAY" :class="styles.icon" />
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

/** 样式抽象 */
const styles = clsx({
  container: [
    'absolute inset-0 m-auto',
    'flex items-center justify-center',
    'size-20 rounded-full bg-black/30 drop-shadow-xs/60',
  ],
  icon: 'size-[61.8%]',
})

const { playerCore } = usePlayerContext()
const visible = shallowRef(false)
const isShowPause = shallowRef(false)
const shouldAnimate = shallowRef(false)

/** 计算动画类名 */
const animationClass = computed(() => {
  if (shouldAnimate.value) {
    return 'animate-[fadeOut_350ms_var(--ui-ease-linear)_forwards]'
  }
  return ''
})

/** 显示播放按钮（无动画，一直显示） */
function showPlayButton() {
  visible.value = true
  isShowPause.value = false
  shouldAnimate.value = false
}

/** 显示动画按钮（有淡出动画） */
function showAnimationButton(paused: boolean) {
  visible.value = true
  isShowPause.value = paused
  shouldAnimate.value = true

  // 300ms 后隐藏
  setTimeout(() => {
    visible.value = false
    shouldAnimate.value = false
  }, 300)
}

/** 隐藏按钮 */
function hideButton() {
  visible.value = false
  shouldAnimate.value = false
}

// 监听 canplay 状态
watch(
  () => playerCore.value?.canplay,
  (value) => {
    if (value) {
      // canplay 为 true 时，如果是暂停状态则立刻无动画显示播放按钮
      if (playerCore?.value?.paused) {
        showPlayButton()
      }
    }
    else {
      // canplay 为 false 时隐藏按钮
      hideButton()
    }
  },
)

// 监听播放状态变化（仅在 canplay 为 true 时生效）
watch(
  () => playerCore?.value?.paused,
  (value) => {
    // 只有在 canplay 为 true 时才响应 paused 变化
    if (!playerCore?.value?.canplay) {
      return
    }

    // paused 变化时显示动画按钮并300ms内淡出
    showAnimationButton(!!value)
  },
)
</script>

<style>
@keyframes fadeOut {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.4);
  }
}
</style>
