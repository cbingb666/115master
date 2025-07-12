<template>
  <div v-if="fileInfo.error" :class="styles.container.error">
    <div>❌ 获取文件信息失败</div>
    <div>{{ fileInfo.error }}</div>
  </div>
  <div v-else-if="fileInfo.isLoading || (!fileInfo.isLoading && !fileInfo.isReady)" :class="styles.container.loading">
    <div class="skeleton w-80 h-7 rounded-lg" />
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
          <li v-for="item in path" :key="item.cid" @click="handleOpenFolder(item.cid)">
            <a>
              {{ item.name }}
            </a>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { useDataFileInfo } from '../../data/useDataFileInfo'
import type { useDataPlaylist } from '../../data/useDataPlaylist'
import { computed } from 'vue'
import { formatFileSize } from '../../../../utils/format'

const props = defineProps<{
  /** 文件信息 */
  fileInfo: ReturnType<typeof useDataFileInfo>
  /** 播放列表 */
  playlist: ReturnType<typeof useDataPlaylist>
}>()

const styles = {
  /** 容器样式 */
  container: {
    main: 'flex items-center gap-4 w-full mx-2',
    error: 'text-red-400',
    loading: 'flex items-center',
  },
  /** 文件信息样式 */
  fileInfo: {
    container: 'flex flex-col flex-1',
    file: 'flex flex-wrap items-center gap-2',
    name: 'font-bold text-base-content text-xl text-shadow-xs/60 line-clamp-2',
    size: 'text-base-content/70 font-semibold text-shadow-xs/60 whitespace-nowrap flex-shrink-0',
    path: {
      container: ['breadcrumbs text-sm text-base-content/80'],
    },
    folder: {
      btn: 'btn btn-sm btn-ghost btn-circle tooltip tooltip-bottom',
      icon: 'size-4',
    },
  },
}

const path = computed(() => {
  return (props.playlist.state?.path ?? []).filter(
    item => Number(item.cid) !== 0,
  )
})

function handleOpenFolder(id: string) {
  window.open(`https://115.com/?cid=${id}&offset=0&mode=wangpan`, '_blank')
}
</script>
