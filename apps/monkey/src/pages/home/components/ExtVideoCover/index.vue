<template>
  <div ref="rootRef" :class="styles.container.main">
    <div :class="styles.container.content">
      <!-- 错误状态 -->
      <div v-if="videoCover.error" :class="styles.states.error">
        <LoadingError size="mini" :message="videoCover.error" />
      </div>

      <!-- 骨架屏 -->
      <template v-else-if="videoCover.isLoading">
        <div :class="styles.skeleton" />
      </template>

      <!-- 内容 -->
      <div
        v-else-if="videoCover.isReady"
        :id="`gallery-${props.pickCode}`"
        class="pswp-gallery"
        :class="styles.cover.container"
      >
        <a
          v-for="(thumbnail, index) in videoCover.state"
          :key="index"
          :class="[styles.cover.thumbItem]"
          @click.prevent.stop="openPhotoSwipe(index)"
        >
          <img
            :src="thumbnail.img"
            :alt="`视频封面 ${index + 1}`"
            :class="styles.cover.thumbImage"
          >
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PhotoSwipeLightbox from 'photoswipe/lightbox'
import PhotoSwipe from 'photoswipe'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LoadingError from '@/components/LoadingError/index.vue'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { clsx } from '@/utils/clsx'
import 'photoswipe/style.css'

const props = defineProps<{
  pickCode: string
  sha1: string
  duration: number | string
  listScrollBoxNode: HTMLElement
}>()

/** 文件列表视频封面数量 */
const FILELIST_VIDEO_COVER_NUM = 5

/** 样式常量定义 */
const styles = clsx({
  // 容器样式
  container: {
    main: 'h-24 w-full max-w-214 px-20 [content-visibility:auto]',
    content:
      'bg-base-300 relative flex h-full items-center overflow-hidden rounded',
  },
  // 状态样式
  states: {
    error: 'flex flex-1 items-center justify-center',
  },
  // 骨架样式
  skeleton: 'skeleton h-full w-full rounded',
  // 视频封面
  cover: {
    container: [
      'flex h-full w-full overflow-hidden select-none',
    ],
    thumbItem: [
      'aspect-video h-full',
      'overflow-hidden',
      'cursor-zoom-in no-underline',
      'transition-opacity hover:opacity-90',
    ],
    thumbImage: ['h-full w-full object-contain object-center align-top'],
  },
})

/** 根元素引用 */
const rootRef = ref<HTMLElement>()
/** PhotoSwipe 实例 */
const lightbox = ref<PhotoSwipeLightbox | null>(null)

/** 滚动目标 ref（用于 useScroll） */
const scrollTargetRef = computed(() => props.listScrollBoxNode)

/** 选项 */
const options = computed(() => ({
  sha1: props.sha1,
  pickCode: props.pickCode,
  coverNum: FILELIST_VIDEO_COVER_NUM,
  duration: Number(props.duration),
}))

/** 配置 */
const config = {
  elementRef: rootRef,
  scrollTarget: scrollTargetRef,
}

/** smart 视频封面 hook */
const { videoCover } = useSmartVideoCover(options, config)

/** 初始化 PhotoSwipe */
function initPhotoSwipe() {
  if (lightbox.value) {
    lightbox.value.destroy()
    lightbox.value = null
  }

  lightbox.value = new PhotoSwipeLightbox({
    dataSource: videoCover.state.map(item => ({
      src: item.img,
      width: item.width,
      height: item.height,
      alt: '视频封面',
    })),
    showHideAnimationType: 'fade',
    pswpModule: () => Promise.resolve(PhotoSwipe),
    mouseMovePan: true,
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 2,
    maxZoomLevel: 4,
    wheelToZoom: true,
    bgOpacity: 0.9,
  })

  lightbox.value.init()
}

/** 打开 PhotoSwipe */
function openPhotoSwipe(index: number) {
  if (!lightbox.value || !videoCover.isReady)
    return
  lightbox.value.loadAndOpen(index)
}

// 监听有效图片变化，初始化 PhotoSwipe
watch(
  () => videoCover.isReady,
  async (isReady) => {
    if (isReady) {
      await nextTick()
      initPhotoSwipe()
    }
  },
)

// 组件销毁时清理
onBeforeUnmount(() => {
  if (lightbox.value) {
    lightbox.value.destroy()
    lightbox.value = null
  }
})
</script>
