<template>
  <div
    v-show="boxVisible"
    :class="styles.root"
    :style="{
      transform: `translateX(${previewTransform}px) translateY(-100%)`,
    }"
  >
    <div
      :class="[
        styles.image.root,
      ]"
      :style="{
        width: `${thumbnailContainerSize.width}px`,
        height: `${thumbnailContainerSize.height}px`,
      }"
    >
      <canvas
        ref="thumbnailCanvas"
        :width="DEFAULT_WIDTH"
        :height="DEFAULT_HEIGHT"
      />

      <transition
        enter-active-class="transition-opacity duration-300 ease-out"
        leave-active-class="transition-opacity duration-60 ease-out"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div
          v-show="thumb.loading.value && !thumb.error.value"
          :class="styles.image.loading"
        />
      </transition>

      <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-60 ease-out"
        enter-from-class="opacity-0 scale-0"
        leave-to-class="opacity-0 scale-0"
      >
        <div
          v-show="thumb.error.value"
          :class="styles.image.error"
        >
          <LoadingError
            :message="thumb.error.value"
            size="mini"
            :show-detail-button="false"
          />
        </div>
      </transition>
    </div>
    <div :class="styles.timeBox.container">
      <span>{{ time }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Ref } from 'vue'
import type { ThumbnailFrame } from '@/components/XPlayer/types'
import { refManualReset } from '@vueuse/core'
import { computed, onUnmounted, shallowRef, toValue, watch } from 'vue'
import { LoadingError } from '@/components'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { formatTime } from '@/components/XPlayer/utils/time'
import { clsx } from '@/utils/clsx'
import { getImageResize } from '@/utils/image'
import { boundary } from '@/utils/number'

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 位置 （0-100） */
  position: number
  /** 时间 */
  time: number
  /** 进度条宽度 */
  progressBarWidth: number
}

/** props */
const props = withDefaults(defineProps<Props>(), {})

const styles = clsx({
  root: ['absolute top-2', '[will-change:transform]'],
  image: {
    root: [
      'relative mb-2 flex items-center justify-center overflow-hidden rounded-2xl',
      'bg-black',
      'box-content',
      'cursor-pointer',
      'border-base-content border-4',
    ],
    loading:
      'loading loading-spinner text-base-content/80 absolute m-auto size-12 rounded-full',
    error: 'absolute inset-0 flex items-center justify-center',
  },
  timeBox: {
    container:
      'text-base-content app-font-time text-center text-sm select-none',
  },
})

/** 默认宽度 */
const DEFAULT_WIDTH = 250

/** 默认高度 */
const DEFAULT_HEIGHT = ratioHeight(DEFAULT_WIDTH, 16, 9)

/** context */
const { rootProps, source } = usePlayerContext()

/** 绘制缩略图请求 */
const { onThumbnailRequest } = rootProps

/** 画布 */
const thumbnailCanvas = shallowRef<HTMLCanvasElement | null>(null)

/** 容器 */
const { previewTransform, thumbnailContainerSize } = usePreviewContainer()

/** 缩略图 */
const thumb = useThumb()

/** 渲染缩略图 */
useRenderThumbnail(
  thumbnailCanvas,
  thumb,
  DEFAULT_WIDTH,
  DEFAULT_HEIGHT,
)

/** 处理缩略图更新 */
const { lastTimer } = useThumbnailUpdate(thumb)

/** 是否显示 */
const boxVisible = computed(() => props.visible && previewTransform.value > -1)

/** 时间 */
const time = computed(() => {
  if (thumb.renderImage.value?.frameTime) {
    return formatTime(thumb.renderImage.value.frameTime)
  }
  return formatTime(props.time)
})

/** 获取当前缩略图的时间（如果存在且可见） */
function getCurrentFrameTime(): number | null {
  if (boxVisible.value && thumb.renderImage.value?.frameTime) {
    return thumb.renderImage.value.frameTime
  }
  return null
}

/**
 * 计算缩略图高度
 * @param width 宽度
 * @param ratioWidth 比例宽度
 * @param ratioHeight 比例高度
 * @returns 高度
 */
function ratioHeight(width: number, ratioWidth: number, ratioHeight: number) {
  return (width * ratioHeight) / ratioWidth
}

/** 缩略图状态 */
function useThumb() {
  /** 最后一次悬停时间 */
  const lastHoverTime = refManualReset(-1)
  /** 最后一次请求时间 */
  const lastRequestTime = refManualReset(-1)
  /** 渲染时间 */
  const renderTime = refManualReset(-1)
  /** 渲染图片 */
  const renderImage = refManualReset<ThumbnailFrame | undefined>(undefined)
  /** 错误 */
  const error = refManualReset<unknown>(undefined)
  /** 是否正在加载 */
  const loading = computed(() =>
    lastRequestTime.value >= 0 && (lastRequestTime.value === lastHoverTime.value),
  )
  return {
    lastHoverTime,
    lastRequestTime,
    renderTime,
    renderImage,
    error,
    loading,
    reset: () => {
      lastHoverTime.reset()
      lastRequestTime.reset()
      renderTime.reset()
      renderImage.reset()
      error.reset()
    },
  }
}

/** 计算预览容器位移 */
function usePreviewContainer() {
  /** 缩略图容器尺寸 */
  const thumbnailContainerSize = shallowRef({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  })

  /** 预览容器位移 */
  const previewTransform = refManualReset(-1)

  // 计算预览容器的位移，防止超出边界
  watch(
    () => [props.position],
    async () => {
      if (!props.visible) {
        previewTransform.reset()
        return
      }

      if (props.progressBarWidth < 0) {
        previewTransform.reset()
        return
      }

      const thumbnailWidth = thumbnailContainerSize.value.width
      const offsetCenter = -(thumbnailWidth / 2)
      const offsetX = props.progressBarWidth * (props.position / 100)
      const offset = offsetCenter + offsetX
      const min = 0
      const max = props.progressBarWidth - thumbnailWidth
      const result = boundary(offset, min, max)
      previewTransform.value = result
    },
  )
  return {
    previewTransform,
    thumbnailContainerSize,
  }
}

/** 渲染缩略图 */
function useRenderThumbnail(
  thumbnailCanvas: Ref<HTMLCanvasElement | null>,
  thumb: ReturnType<typeof useThumb>,
  width: number,
  height: number,
) {
  /** 动画请求 ID */
  let animationRequestID: number | null = null

  /** canvas 上下文 */
  const ctx = computed(() => thumbnailCanvas.value?.getContext('2d'))

  /** 渲染缩略图 */
  function renderThumbnail() {
    if (!ctx.value) {
      throw new Error('ctx not found')
    }

    const renderImage = toValue(thumb.renderImage)
    const renderTime = toValue(thumb.renderTime)
    const lastHoverTime = toValue(thumb.lastHoverTime)

    /** 清空画布 */
    ctx.value.clearRect(0, 0, width, height)

    // 如果缩略图存在且渲染时间与最新Hover时间相同，则绘制缩略图
    if (renderImage && renderTime === lastHoverTime) {
      const imgWidth = renderImage.img.width
      const imgHeight = renderImage.img.height
      const { width: resizeWidth, height: resizeHeight } = getImageResize(
        imgWidth,
        imgHeight,
        width,
        height,
      )
      const dx = (DEFAULT_WIDTH - resizeWidth) / 2
      const dy = (DEFAULT_HEIGHT - resizeHeight) / 2
      ctx.value.fillStyle = '#000'
      ctx.value.drawImage(
        renderImage.img,
        dx,
        dy,
        resizeWidth,
        resizeHeight,
      )
    }
  }

  // 绘制缩略图
  watch(
    () => [thumb.renderImage.value, thumb.error.value],
    () => {
      if (thumbnailCanvas.value && ctx.value) {
        if (animationRequestID) {
          cancelAnimationFrame(animationRequestID)
          animationRequestID = null
        }
        animationRequestID = requestAnimationFrame(renderThumbnail)
      }
    },
  )
}

/** 处理缩略图更新 */
function useThumbnailUpdate(thumb: ReturnType<typeof useThumb>) {
  /** 防抖时间 */
  const DEBOUNCE_TIME = 50

  /** 最后一次定时器 */
  const lastTimer = refManualReset<number | null>(null)

  /** 更新缩略图 */
  async function updateThumbnail(hoverTime: number, isLast: boolean) {
    if (!isLast) {
      lastTimer.value = window.setTimeout(() => {
        if (hoverTime === toValue(thumb.lastHoverTime)) {
          updateThumbnail(hoverTime, true)
        }
      }, DEBOUNCE_TIME)
    }

    thumb.renderImage.reset()

    try {
    /** 尝试从缓存中取, 其实是同步返回 */
      const cacheImage = await onThumbnailRequest?.({
        type: 'Cache',
        time: hoverTime,
        isLast,
      })
      if (cacheImage) {
        thumb.renderImage.value = cacheImage
        thumb.renderTime.value = hoverTime

        if (isLast) {
          thumb.lastRequestTime.reset()
        }
        thumb.error.reset()
        return
      }

      thumb.lastRequestTime.value = hoverTime
      const newImage = await onThumbnailRequest?.({
        type: 'Must',
        time: hoverTime,
        isLast,
      })
      if (!newImage)
        return

      // 如果请求时间与最新Hover时间相同，则更新缩略图
      if (hoverTime === thumb.lastHoverTime.value && isLast) {
        thumb.lastRequestTime.reset()
        thumb.renderImage.value = newImage
        thumb.renderTime.value = hoverTime
        thumb.error.reset()
      }
    }
    catch (error) {
      thumb.lastRequestTime.reset()
      thumb.error.value = error
    }
  }
  // 监听缩略图请求
  watch(
    () => [props.visible, props.time],
    async () => {
      if (!onThumbnailRequest)
        return
      if (!props.visible || !props.time) {
        thumb.lastHoverTime.reset()
        thumb.renderImage.reset()
        return
      }

      const hoverTime = props.time
      // 更新 hover 时间
      thumb.lastHoverTime.value = hoverTime
      await updateThumbnail(hoverTime, false)
    },
  )
  return {
    lastTimer,
    updateThumbnail,
  }
}

// 监听源列表
watch(() => source.list, () => {
  thumb.reset()
  if (lastTimer.value) {
    clearTimeout(lastTimer.value)
    lastTimer.reset()
  }
})

onUnmounted(() => {
  if (lastTimer.value) {
    clearTimeout(lastTimer.value)
    lastTimer.reset()
  }
})

/** 暴露方法供父组件调用 */
defineExpose({
  getCurrentFrameTime,
})
</script>
