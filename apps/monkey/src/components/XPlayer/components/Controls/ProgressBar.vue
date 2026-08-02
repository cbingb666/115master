<template>
  <div
    :class="styles.progressBar.root"
    :data-long-press="isLongPressDragging"
    :data-dragging="isDragging"
    :data-canplay="canplay"
  >
    <!-- 进度条外容器 -->
    <div
      ref="progressBarWrapperRef"
      :class="styles.progressBar.wrapper"
      @mousedown="handleBarWrapperMouseDown"
      @mouseenter="handleBarWrapperMouseEnter"
      @mousemove="handleBarWrapperMouseMoveWithThrottle"
      @mouseleave="handleBarWrapperMouseLeave"
    >
      <!-- 进度条内容器 -->
      <div :class="[styles.progressBar.track]">
        <!-- 原始播放进度（拖拽时保持显示） -->
        <div
          :class="styles.thumb.current"
          :style="{
            transform: `scaleX(${progressValue / 100})`,
            opacity: isDragging ? 0 : 1,
          }"
        />

        <!-- 拖拽时的实时进度 -->
        <div
          v-if="isDragging"
          :class="[styles.thumb.current, styles.thumb.dragging]"
          :style="{ transform: `scaleX(${dragProgress / 100})` }"
        />

        <!-- 预览进度 -->
        <div
          v-show="isPreviewVisible && !isDragging"
          :class="styles.thumb.hover"
          :style="{ transform: `scaleX(${previewProgress / 100})` }"
        />
      </div>
    </div>
    <!-- 缩略图预览 -->
    <Thumbnail
      ref="thumbnailRef"
      :visible="isPreviewVisible || isDragging"
      :position="isDragging ? dragProgress : previewProgress"
      :time="previewTime"
      :progress-bar-width="progressBarWidth"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Thumbnail from '@/components/XPlayer/components/Thumbnail/index.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

/** 样式抽象 */
const styles = clsx({
  progressBar: {
    root: [
      'relative',
      'group',
      'hidden',
      'data-[canplay=true]:block',
    ],
    wrapper: 'relative cursor-pointer py-4',
    track:
      [
        'h-2',
        'relative',
        'transition-[height]',
        'duration-100',
        'ease-[var(--ui-ease-linear)]',
        'rounded-full',
        'overflow-hidden',
        'bg-white/25',
        'shadow-[0_0_1px_rgba(0,0,0,0.1),0_0_32px_rgba(0,0,0,0.1)]',
      ],
  },
  thumb: {
    current:
      'absolute h-full w-full origin-left bg-white/95 transition-transform duration-100 ease-[var(--ui-ease-settle)]',
    dragging: 'transition-none',
    hover: 'pointer-events-none absolute h-full w-full origin-left bg-white/15',
  },
})

const { progressBar, playerCore } = usePlayerContext()

/** 缩略图组件引用 */
const thumbnailRef = ref<any>(null)

/** 是否可以播放 */
const canplay = computed(() => {
  return playerCore.value?.canplay ?? false
})

/** 从 hook 中解构所有需要的状态和方法 */
const {
  progressBarWrapperRef,
  progressBarWidth,
  progressValue,
  isDragging,
  dragProgress,
  previewTime,
  previewProgress,
  isPreviewVisible,
  isLongPressDragging,
  handleBarWrapperMouseDown,
  handleBarWrapperMouseEnter,
  handleBarWrapperMouseMoveWithThrottle,
  handleBarWrapperMouseLeave,
  setThumbnailRef,
} = progressBar

/** 将 thumbnailRef 传递给 hook */
watch(thumbnailRef, (newRef) => {
  setThumbnailRef(newRef)
}, { immediate: true })
</script>
