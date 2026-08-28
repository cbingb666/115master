<template>
  <div v-if="fileInfo.error" :class="styles.container.error">
    <div class="flex items-center gap-2">
      <Icon :name="I.ERROR" class="text-error" />获取文件信息失败
    </div>
    <div>{{ fileInfo.error }}</div>
  </div>
  <div v-else-if="fileInfo.isLoading || (!fileInfo.isLoading && !fileInfo.isReady)" :class="styles.container.loading">
    <div class="skeleton h-7 w-80 rounded-lg" />
  </div>
  <div v-else :class="styles.container.main">
    <div :class="styles.fileInfo.container">
      <div :class="styles.fileInfo.file">
        <!-- 文件名 -->
        <span data-app-video-title :class="styles.fileInfo.name">
          <span
            v-if="position"
            data-app-video-position
            :class="styles.fileInfo.position"
          >{{ position }}</span>{{ position ? ' ' : '' }}
          <span>{{ name }}</span>
        </span>
        <!-- 文件大小 -->
        <span :class="styles.fileInfo.size">
          {{ format.fileSize(Number(fileInfo.state?.file_size)) }}
        </span>
      </div>
      <!-- 目录 -->
      <div :class="styles.fileInfo.path.container">
        <ul>
          <li v-for="item in path" :key="item.cid">
            <a
              :href="`https://115.com/?cid=${item.cid}&offset=0&tab=&mode=wangpan`"
              target="_blank"
              rel="noreferrer"
            >
              {{ item.name }}
            </a>
          </li>
        </ul>
      </div>
    </div>
    <slot name="default" />
  </div>
</template>

<script setup lang="ts">
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import type { useDataFileInfo } from '@/pages/video/data/useDataFileInfo'
import type { useDataPlaylist } from '@/pages/video/data/useDataPlaylist'
import { format } from '@115master/utils'
import { computed } from 'vue'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = defineProps<{
  /** 播放器上下文 */
  ctx: PlayerContext
  /** 文件信息 */
  fileInfo: ReturnType<typeof useDataFileInfo>
  /** 播放列表 */
  playlist: ReturnType<typeof useDataPlaylist>
}>()

defineSlots<{
  default?: () => void
}>()

const styles = clsx({
  /** 容器样式 */
  container: {
    main: 'mx-2 flex w-full items-start gap-4',
    error: 'text-error',
    loading: 'flex items-center',
  },
  /** 文件信息样式 */
  fileInfo: {
    container: 'flex flex-1 flex-col',
    file: 'flex flex-wrap items-center gap-2 tracking-tight',
    name: 'app-text-shadow-dark line-clamp-2 text-xl font-semibold text-white',
    position: 'mr-2 inline-block rounded-md bg-white/15 px-1.5 py-0.5 align-middle text-sm font-medium tracking-normal whitespace-nowrap text-white/70',
    size: 'app-text-shadow-dark flex-shrink-0 text-xs font-medium tracking-wide whitespace-nowrap text-white',
    path: {
      container: [
        'breadcrumbs',
        'text-xs font-medium text-white',
        'tracking-wide',
        'app-text-shadow-dark',
      ],
    },
  },
})

const path = computed(() => {
  return (props.playlist.state?.path ?? []).filter(
    item => Number(item.cid) !== 0,
  )
})

const name = computed(() => {
  return props.fileInfo.state?.file_name?.toUpperCase() ?? ''
})

const position = computed(() => {
  const data = props.playlist.state?.data
  if (!data || data.length <= 1) {
    return
  }

  const index = data.findIndex(
    item => item.pc === props.fileInfo.state?.pick_code,
  )
  if (index < 0) {
    return
  }

  return `${index + 1}/${data.length}`
})
</script>
