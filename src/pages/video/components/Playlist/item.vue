<template>
  <div
    ref="rootRef"
    :class="[styles.item.base, { [styles.item.active]: props.active }]"
    @click="handlePlay(item)"
  >
    <div :class="styles.cover.container">
      <template v-if="videoCover.error">
        <LoadingError
          :class="styles.cover.imageError"
          :message="videoCover.error"
          size="mini"
        />
      </template>

      <div v-else-if="videoCover.isLoading" :class="styles.cover.skeleton" />

      <!-- 视频封面 -->
      <img v-else-if="videoCover.isReady" :src="videoCover.state[0]?.img" :class="styles.cover.image">

      <!-- 骨架屏 -->
      <div v-else :class="styles.cover.skeleton" />

      <!-- 时长 -->
      <div :class="styles.duration.container">
        {{ formatTime(item.play_long) }}
      </div>

      <!-- 收藏 -->
      <div v-if="item.m" :class="styles.mark.container">
        <Icon :icon="ICON_STAR_FILL" :class="styles.mark.icon" />
      </div>

      <!-- 进度条 -->
      <div v-if="item.current_time > 0" :class="styles.progress.container">
        <div :class="styles.progress.bar" :style="{ width: `${progressPercent * 100}%` }" />
      </div>
    </div>
    <div :class="styles.info.container">
      <!-- 标题 -->
      <div :class="[styles.info.title, { [styles.info.titleActive]: props.active }]" :title="item.n">
        {{ item.n }}
      </div>
      <!-- 大小 -->
      <div :class="styles.info.size">
        {{ formatFileSize(item.s) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '../../../../utils/drive115'
import { Icon } from '@iconify/vue'
import { computed, shallowRef } from 'vue'
import LoadingError from '../../../../components/LoadingError/index.vue'
import { formatTime } from '../../../../components/XPlayer/utils/time'
import { useSmartVideoCover } from '../../../../hooks/useVideoCover'
import { ICON_STAR_FILL } from '../../../../icons'
import { formatFileSize } from '../../../../utils/format'

const props = defineProps<{
  item: Entity.PlaylistItem
  active: boolean
}>()

const emit = defineEmits<{
  play: [Entity.PlaylistItem]
}>()

/** 播放列表视频封面数量 */
const PLAYLIST_VIDEO_COVER_NUM = 1

/** 样式常量定义 */
const styles = {
  item: {
    base: [
      'flex cursor-pointer break-words hover:bg-base-content/5',
      'rounded-lg',
      'transition-colors duration-200',
    ],
    active: 'bg-primary/10 hover:bg-primary/15',
  },
  cover: {
    container: [
      'relative flex items-center justify-center flex-shrink-0',
      'overflow-hidden rounded-lg',
      'w-50 h-28 aspect-video',
      'before:content-[\'\'] before:absolute before:inset-0 before:bg-black before:rounded-lg',
    ],
    skeleton: 'relative skeleton w-full h-full rounded-lg',
    imageError: 'relative!',
    image: 'relative block w-full h-full object-contain',
  },
  duration: {
    container: [
      'absolute bottom-1.5 right-1.5 rounded-lg',
      'px-1.5 py-1',
      'backdrop-blur-xs',
      'text-xs bg-base-100/60 text-base-content/80',
    ],
  },
  mark: {
    container: [
      'absolute top-1.5 left-1.5 p-0.5',
      'rounded-lg',
      'bg-base-100/60',
      'backdrop-blur-xs',
    ],
    icon: 'size-7 drop-shadow-xs/90',
  },
  progress: {
    container: 'absolute bottom-0 right-0 w-full h-1',
    bar: 'absolute top-0 left-0 w-0 h-full bg-primary opacity-80',
  },
  info: {
    container: 'flex flex-col justify-between gap-1 p-2.5 px-4',
    title:
      'text-sm font-medium break-all leading-6 text-base-content line-clamp-3',
    titleActive: 'text-primary',
    size: 'text-xs text-base-content/60',
  },
}

/** 根元素引用 */
const rootRef = shallowRef<HTMLElement>()

/** 选项 */
const options = computed(() => ({
  pickCode: props.item.pc,
  sha1: props.item.sha,
  coverNum: PLAYLIST_VIDEO_COVER_NUM,
  duration: props.item.play_long,
}))

/** 配置 */
const config = {
  elementRef: rootRef,
}

/** smart 视频封面 hook */
const { videoCover } = useSmartVideoCover(options, config)

/** 进度百分比 */
const progressPercent = computed(() => {
  return props.item.current_time / props.item.play_long
})

/** 播放处理 */
function handlePlay(item: Entity.PlaylistItem) {
  emit('play', item)
}
</script>
