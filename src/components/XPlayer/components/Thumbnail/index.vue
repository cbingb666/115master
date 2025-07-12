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
        {
          [styles.image.pressing]: progressBar.isDragging.value,
        },
      ]"
      :style="{
        width: `${thumbnailContainerSize.width}px`,
        height: `${thumbnailContainerSize.height}px`,
      }"
      @mouseenter="isHoveringImage = true"
      @mouseleave="isHoveringImage = false"
      @mouseup="handleThumbnailMouseUp"
    >
      <canvas
        ref="thumbnailCanvas"
        :width="DEFAULT_WIDTH"
        :height="DEFAULT_HEIGHT"
      />

      <transition
        enter-active-class="transition-opacity duration-150 ease-out delay-60"
        leave-active-class="transition-opacity duration-150 ease-out delay-60"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <div v-if="loading" :class="styles.image.loading" />
      </transition>

      <div
        v-if="thumb.error"
        :class="styles.image.error"
      >
        <LoadingError
          :message="thumb.error"
          size="mini"
        />
      </div>
    </div>
    <div :class="styles.timeBox.container">
      <span
        v-if="isHoveringImage && thumb.renderImage?.frameTime"
      >
        跳至 {{ formatTime(thumb.renderImage?.frameTime || 0) }} 预览时间
      </span>
      <span
        v-else
      >
        {{ formatTime(props.time) }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ThumbnailFrame } from '../../types'
import { computed, onUnmounted, reactive, ref, shallowRef, watch } from 'vue'
import LoadingError from '../../../../components/LoadingError/index.vue'
import { getImageResize } from '../../../../utils/image'
import { boundary } from '../../../../utils/number'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { formatTime } from '../../utils/time'

/** props */
const props = withDefaults(defineProps<Props>(), {})

/** emit */
const emit = defineEmits<(e: 'seek', time: number) => void>()

const styles = {
  root: ['absolute top-0', '[will-change:transform]'],
  image: {
    root: [
      'relative flex items-center justify-center rounded-xl overflow-hidden mb-2',
      'bg-black shadow-xs/30',
      'cursor-pointer transition-all duration-550 ease-out',
      'hover:scale-[1.02]',
    ],
    pressing: 'ring-4 ring-base-content/90',
    loading:
      'absolute loading loading-spinner size-12 m-auto rounded-full text-base-content/80',
    error: 'absolute inset-0 flex items-center justify-center',
  },
  timeBox: {
    container:
      'text-sm py-0.5 text-neutral-300 subpixel-antialiased text-center select-none text-shadow-[0_0_1px_rgb(0_0_0_/0.5),0_0_2px_rgb(55_55_55_/0.7)]',
  },
}

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

/** context */
const { rootProps, source, progressBar } = usePlayerContext()

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

/** 默认宽度 */
const DEFAULT_WIDTH = 250
/** 默认高度 */
const DEFAULT_HEIGHT = ratioHeight(DEFAULT_WIDTH, 16, 9)
/** 是否正在悬停 */
const isHoveringImage = ref(false)
/** 绘制缩略图请求 */
const { onThumbnailRequest } = rootProps
/** 画布 */
const thumbnailCanvas = shallowRef<HTMLCanvasElement | null>(null)
/** 缩略图容器尺寸 */
const thumbnailContainerSize = shallowRef({
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
})
/** 最后一次定时器 */
const lastTimer = shallowRef<NodeJS.Timeout | null>(null)
/** 缩略图 */
const thumb = reactive<{
  lastHoverTime: number
  lastRequestTime: number
  renderTime: number
  renderImage: ThumbnailFrame | undefined
  error: unknown
}>({
  // 最后一次 hover 时间
  lastHoverTime: -1,
  // 最后一次请求时间
  lastRequestTime: -1,
  // 渲染时间
  renderTime: -1,
  // 渲染图片
  renderImage: undefined,
  // 错误
  error: undefined,
})
/** 预览容器的位移 */
const previewTransform = shallowRef(-1)
/** 是否显示 */
const boxVisible = computed(() => props.visible && previewTransform.value > -1)
/** canvas 上下文 */
const ctx = computed(() => thumbnailCanvas.value?.getContext('2d'))
/** 是否正在加载 */
const loading = computed(
  () =>
    thumb.lastRequestTime >= 0 && thumb.lastRequestTime === thumb.lastHoverTime,
)

// 计算预览容器的位移，防止超出边界
watch(
  () => [props.position],
  async () => {
    if (!props.visible) {
      previewTransform.value = -1
      return
    }

    if (props.progressBarWidth < 0) {
      previewTransform.value = -1
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

/** 更新缩略图 */
async function updateThumbnail(hoverTime: number, isLast: boolean) {
  if (lastTimer.value) {
    clearTimeout(lastTimer.value)
    lastTimer.value = null
  }

  // 重置缩略图
  thumb.renderImage = undefined

  if (!isLast) {
    lastTimer.value = setTimeout(() => {
      if (hoverTime === thumb.lastHoverTime) {
        updateThumbnail(hoverTime, true)
      }
    }, 50)
  }

  try {
    /** 尝试从缓存中取, 其实是同步返回 */
    const cacheImage = await onThumbnailRequest?.({
      type: 'Cache',
      time: hoverTime,
      isLast,
    })
    if (cacheImage) {
      thumb.renderImage = cacheImage
      thumb.renderTime = hoverTime

      if (isLast) {
        thumb.lastRequestTime = -1
      }
      thumb.error = undefined
      return
    }

    thumb.lastRequestTime = hoverTime
    const newImage = await onThumbnailRequest?.({
      type: 'Must',
      time: hoverTime,
      isLast,
    })
    if (!newImage)
      return

    // 如果请求时间与最新Hover时间相同，则更新缩略图
    if (hoverTime === thumb.lastHoverTime && isLast) {
      thumb.lastRequestTime = -1
      thumb.renderImage = newImage
      thumb.renderTime = hoverTime
      thumb.error = undefined
    }
  }
  catch (error) {
    thumb.error = error
  }
}

// 监听缩略图请求
watch(
  () => [props.visible, props.time],
  async () => {
    if (!onThumbnailRequest)
      return
    if (!props.visible || !props.time) {
      thumb.lastHoverTime = -1
      thumb.renderImage = undefined
      return
    }

    const hoverTime = props.time
    // 更新 hover 时间
    thumb.lastHoverTime = hoverTime
    await updateThumbnail(hoverTime, false)
  },
)

// 绘制缩略图
watch(
  () => [thumb.renderImage, thumb.error],
  () => {
    if (thumb.error) {
      return
    }

    if (thumbnailCanvas.value && ctx.value) {
      requestAnimationFrame(() => {
        if (!ctx.value) {
          throw new Error('ctx not found')
        }

        // 清空整个画布
        ctx.value.clearRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT)

        // 如果缩略图存在且渲染时间与最新Hover时间相同，则绘制缩略图
        if (thumb.renderImage && thumb.renderTime === thumb.lastHoverTime) {
          const imgWidth = thumb.renderImage.img.width
          const imgHeight = thumb.renderImage.img.height
          const { width: resizeWidth, height: resizeHeight } = getImageResize(
            imgWidth,
            imgHeight,
            DEFAULT_WIDTH,
            DEFAULT_HEIGHT,
          )
          const dx = (DEFAULT_WIDTH - resizeWidth) / 2
          const dy = (DEFAULT_HEIGHT - resizeHeight) / 2
          ctx.value.fillStyle = '#000'
          ctx.value.fillRect(0, 0, DEFAULT_WIDTH, DEFAULT_HEIGHT)
          ctx.value.drawImage(
            thumb.renderImage.img,
            dx,
            dy,
            resizeWidth,
            resizeHeight,
          )
        }
      })
    }
  },
)

// 监听源列表
watch([source.list], () => {
  thumb.lastHoverTime = -1
  thumb.lastRequestTime = -1
  thumb.renderTime = -1
  thumb.renderImage = undefined
  if (lastTimer.value) {
    clearTimeout(lastTimer.value)
    lastTimer.value = null
  }
})

/** 处理缩略图点击事件 */
function handleThumbnailMouseUp(e: MouseEvent) {
  // 使用缩略图实际对应的时间点进行跳转
  if (thumb.renderImage?.frameTime) {
    e.stopPropagation()
    emit('seek', thumb.renderImage.frameTime)
  }
}

onUnmounted(() => {
  if (lastTimer.value) {
    clearTimeout(lastTimer.value)
    lastTimer.value = null
  }
})
</script>
