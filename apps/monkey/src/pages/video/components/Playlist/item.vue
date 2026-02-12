<template>
  <a
    ref="rootRef"
    :href="`https://115.com/web/lixian/master/video/?pick_code=${item.pc}`"
    target="_blank"
    rel="noreferrer"
    :class="[styles.item.base]"
    @click.prevent="handlePlay(item)"
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
  </a>
</template>

<script setup lang="ts">
import type { Entity } from '@/utils/drive115'
import { Icon } from '@iconify/vue'
import { computed, shallowRef } from 'vue'
import LoadingError from '@/components/LoadingError/index.vue'
import { formatTime } from '@/components/XPlayer/utils/time'
import { useSmartVideoCover } from '@/hooks/useVideoCover'
import { ICON_STAR_FILL } from '@/icons'
import { clsx } from '@/utils/clsx'
import { formatFileSize } from '@/utils/format'

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
const styles = clsx({
  item: {
    base: [
      'flex cursor-pointer break-words',
    ],
  },
  cover: {
    container: [
      'relative flex flex-shrink-0 items-center justify-center',
      'overflow-hidden rounded-xl',
      'aspect-video h-28 w-50',
      'before:absolute before:inset-0 before:rounded-xl before:bg-black before:content-[\'\']',
      'group/cover',
    ],
    skeleton: 'skeleton relative h-full w-full rounded-xl',
    imageError: 'relative!',
    image: 'relative block h-full w-full object-contain',
  },
  duration: {
    container: [
      'absolute right-2 bottom-2 rounded-md',
      'px-1.5 py-0.5',
      'backdrop-blur-md',
      'bg-base-100/40 text-base-content/70 text-xs',
      'font-medium',
      'tracking-tight',
      'app-font-time',
      'app-shadow',
    ],
  },
  mark: {
    container: [
      'absolute top-1.5 left-1.5 p-0.5',
    ],
    icon: 'size-6 text-pink-600 drop-shadow-xs/50',
  },
  progress: {
    container: [
      'absolute right-0 bottom-0 h-[4px] w-full',
      'bg-base-100/40',
    ],
    bar: [
      'bg-base-content absolute top-0 left-0 h-full w-0',
      'app-shadow',
    ],
  },
  info: {
    container: 'flex flex-col justify-between gap-1 px-4',
    title: [
      'text-base-content/90 line-clamp-3 text-sm leading-5 break-all',
      'font-medium',
    ],
    titleActive: 'text-primary',
    size: 'text-base-content/30 app-font-file-size text-xs font-medium tracking-tight',
  },
})

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
