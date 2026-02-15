<template>
  <div :class="styles.playlist.container">
    <div :class="styles.box">
      <div :class="styles.playlist.header.root">
        <div :class="styles.playlist.header.title">
          <Icon :icon="ICON_PLAYLIST" class="size-10" />
          播放列表
          <span
            v-if="playlist.state?.data?.length && playlist.state?.data?.length > 0"
            :class="styles.playlist.header.count"
          >({{ playlist.state?.data.length }})</span>
        </div>
        <button :class="styles.playlist.header.close" @click="emit('close')">
          <Icon :icon="ICON_CLOSE" :class="styles.playlist.header.closeIcon" />
        </button>
      </div>

      <div v-if="playlist.error" :class="styles.playlist.content">
        <LoadingError :message="playlist.error" />
      </div>
      <div v-else-if="playlist.isLoading || (!playlist.isLoading && !playlist.isReady)" :class="styles.playlist.content">
        <div class="skeleton h-24 w-full rounded-lg" />
      </div>
      <div
        v-else
        class="custom-scrollbar" :class="[styles.playlist.content]"
      >
        <PlaylistItem
          v-for="item in playlist.state?.data"
          ref="playlistItemRefs"
          :key="item.pc"
          :item="item"
          :active="item.pc === pickCode"
          @play="handlePlay"
        />
        <div :class="styles.playlist.divider" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Entity } from '@115master/drive115'
import type PlaylistItemVue from './item.vue'
import type { useDataPlaylist } from '@/pages/video/data/useDataPlaylist'
import { Icon } from '@iconify/vue'
import { nextTick, useTemplateRef, watch } from 'vue'
import { LoadingError } from '@/components'
import { ICON_CLOSE, ICON_PLAYLIST } from '@/icons'
import { clsx } from '@/utils/clsx'
import PlaylistItem from './item.vue'

const props = defineProps<{
  playlist: ReturnType<typeof useDataPlaylist>
  pickCode?: string
}>()

const emit = defineEmits<{
  play: [item: Entity.FilesItem]
  close: []
}>()

/** 样式常量定义 */
const styles = clsx({
  box: [
    '[--space:calc(var(--spacing)*4)]',
    'relative',
    'h-[calc(100%-var(--space)*2)] w-[calc(100%-var(--space)*2)]',
    'mx-auto mt-[var(--space)]',
    'bg-base-100',
    'rounded-3xl',
    'overflow-hidden',
    'app-glass-border',
  ],
  playlist: {
    container: [
      'relative box-border flex h-full flex-col text-white',
      '[--app-playlist-space:calc(var(--spacing)*4)]',
      '[--app-playlist-header-height:calc(var(--spacing)*16)]',
    ],
    header: {
      root: [
        'absolute inset-x-0 top-0 z-1',
        'flex flex-shrink-0 items-center justify-between',
        'h-(--app-playlist-header-height)',
        'px-(--app-playlist-space) py-4',
        'text-base-content',
        'app-bg-gradient-glass',
      ],
      title: 'flex items-center gap-2.5 text-xl font-medium tracking-tight',
      count: 'text-base-content/70 text-sm tracking-wide',
      close: 'btn btn-ghost btn-circle',
      closeIcon: 'size-6',
    },
    content: [
      'flex h-full flex-col gap-5',
      'h-[calc(100%-var(--app-playlist-header-height))]',
      'overflow-y-auto',
      'px-(--app-playlist-space) pt-[var(--app-playlist-header-height)]',
      '[&::-webkit-scrollbar-track]:mt-(--app-playlist-header-height)',
      '[&::-webkit-scrollbar-track]:mb-6',
    ],
    divider: 'divider text-base-content/30 mx-auto w-1/3',
  },
})

const playlistItemRefs
  = useTemplateRef<InstanceType<typeof PlaylistItemVue>[]>('playlistItemRefs')

/** 点击播放 */
function handlePlay(item: Entity.FilesItem) {
  if (item.pc === props.pickCode) {
    return
  }
  emit('play', item)
}

/**
 * 滚动到激活的项目
 */
async function scrollToActiveItem(withAnimation = true) {
  await nextTick()

  if (!playlistItemRefs.value)
    return

  /** 查找激活的项目 */
  const activeItemRef = playlistItemRefs.value.find(ref => ref.$props.active)
  if (!activeItemRef)
    return

  activeItemRef.$el.scrollIntoView({
    behavior: withAnimation ? 'smooth' : 'instant',
    block: 'center',
  })
}

/** 监听 pickCode 的变化，滚动到激活的项目 */
watch(
  [() => props.playlist.state],
  () => scrollToActiveItem(false),
)

watch(
  () => props.pickCode,
  () => scrollToActiveItem(true),
)
</script>
