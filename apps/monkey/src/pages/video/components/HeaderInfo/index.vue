<template>
  <div v-if="fileInfo.error" :class="styles.container.error">
    <div>❌ 获取文件信息失败</div>
    <div>{{ fileInfo.error }}</div>
  </div>
  <div v-else-if="fileInfo.isLoading || (!fileInfo.isLoading && !fileInfo.isReady)" :class="styles.container.loading">
    <div class="skeleton h-7 w-80 rounded-lg" />
  </div>
  <div v-else :class="styles.container.main">
    <div :class="styles.fileInfo.container">
      <div :class="styles.fileInfo.file">
        <!-- 文件名 -->
        <span :class="styles.fileInfo.name">
          {{ fileInfo.state?.file_name?.toUpperCase() }}
        </span>
        <!-- 文件大小 -->
        <span :class="styles.fileInfo.size">
          {{ formatFileSize(Number(fileInfo.state?.file_size)) }}
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
import { computed } from 'vue'
import { clsx } from '@/utils/clsx'
import { formatFileSize } from '@/utils/format'

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
    error: 'text-red-400',
    loading: 'flex items-center',
  },
  /** 文件信息样式 */
  fileInfo: {
    container: 'flex flex-1 flex-col',
    file: 'flex flex-wrap items-center gap-2 tracking-tight',
    name: 'text-base-content app-text-shadow-dark line-clamp-2 text-xl font-semibold',
    size: 'text-base-content app-text-shadow-dark flex-shrink-0 text-xs font-medium tracking-wide whitespace-nowrap',
    path: {
      container: [
        'breadcrumbs',
        'text-base-content text-xs font-medium',
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
</script>
