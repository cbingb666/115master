<template>
  <Popup
    :class="styles.root"
    :visible="statistics.visible.value"
  >
    <div :class="styles.container.main">
      <!-- 头部 -->
      <div :class="styles.container.header">
        <div :class="styles.titleContainer">
          <Icon :icon="ICON_STATISTICS_INFO" :class="styles.titleIcon" />
          <h3 :class="styles.container.headerTitle">
            Statistics
          </h3>
        </div>
        <button :class="styles.closeButton" @click="statistics.toggleVisible">
          <Icon icon="material-symbols:close-rounded" class="size-4" />
        </button>
      </div>

      <!-- 滚动内容区 -->
      <div :class="styles.container.content">
        <div :class="styles.container.sectionsWrapper">
          <!-- Player Core -->
          <div :class="styles.section.wrapper">
            <h4 :class="styles.section.header">
              Player Core
            </h4>
            <div :class="styles.section.content">
              <table :class="styles.table.wrapper">
                <tbody>
                  <tr>
                    <td :class="styles.table.labelCell">
                      Core Type:
                    </td>
                    <td :class="styles.table.valueCell">
                      {{ playerCoreType }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Source Info -->
          <div :class="styles.section.wrapper">
            <h4 :class="styles.section.header">
              Source Info
            </h4>
            <div :class="styles.section.content">
              <table :class="[styles.table.wrapper, styles.table.fixedLayout]">
                <tbody>
                  <tr v-for="(value, key) in sourceInfoItems" :key="key">
                    <td :class="styles.table.labelCell">
                      {{ key }}:
                    </td>
                    <td :class="styles.table.valueCell">
                      {{ value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Streams -->
          <div v-if="hasStreams" :class="[styles.section.wrapper]">
            <div :class="styles.section.header">
              <h4 :class="styles.container.headerTitle">
                Streams
              </h4>
              <span :class="styles.section.headerDesc">{{ streamsCount }}</span>
            </div>
            <div :class="styles.section.content">
              <table
                v-for="stream in streams"
                :key="stream.id"
                :class="[styles.table.wrapper, styles.table.fixedLayout, styles.table.subTable, {
                  [styles.table.active]: isActiveStream(stream.id),
                }]"
              >
                <tbody>
                  <tr>
                    <td :class="styles.table.labelCell">
                      {{ stream.mediaType }}
                    </td>
                    <td :class="styles.table.valueCell">
                      ID: {{ stream.id }}
                    </td>
                  </tr>
                  <tr v-for="(value, label) in getStreamProperties(stream)" :key="label">
                    <td :class="styles.table.labelCell">
                      {{ label }}:
                    </td>
                    <td :class="styles.table.valueCell">
                      {{ value }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Core Stats -->
          <div v-if="hasStats" :class="styles.section.wrapper">
            <h4 :class="styles.section.header">
              Core Stats
            </h4>
            <div :class="styles.section.content">
              <table :class="styles.table.wrapper">
                <tbody>
                  <tr v-for="(value, key) in statsItems" :key="key">
                    <td :class="styles.table.labelCell">
                      {{ key }}:
                    </td>
                    <td :class="styles.table.valueCell">
                      {{ value }}
                    </td>
                  </tr>
                  <tr v-if="hasAudioVideoTimes">
                    <td :class="styles.table.labelCell">
                      A-V:
                    </td>
                    <td :class="styles.table.valueCell">
                      {{ audioVideoTimeDiff }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 错误信息 -->
          <div v-if="hasLoadError" :class="styles.section.wrapper">
            <h4 :class="styles.section.header">
              错误信息
            </h4>
            <div :class="styles.section.content">
              <div :class="styles.error">
                {{ errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { PlayerCoreType } from '../../hooks/playerCore/types'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { ICON_STATISTICS_INFO } from '../../utils/icon'
import Popup from '../Popup/index.vue'

const styles = {
  // 根元素样式
  root: 'top-4! left-4! w-lg h-2/3 p-0!',
  // 标题容器样式
  titleContainer: 'flex items-center space-x-2 gap-2',
  // 标题图标样式
  titleIcon: 'size-6',
  // 容器样式
  container: {
    main: 'bg-base-100 h-full rounded-xl flex flex-col',
    header:
      'flex justify-between items-center px-4 py-2 bg-base-200 rounded-t-xl',
    headerTitle: 'text-base font-medium text-base-content',
    content: 'overflow-y-auto flex-1 pb-5',
    sectionsWrapper: 'space-y-6 text-sm',
  },
  // 章节样式
  section: {
    wrapper: 'stats-section',
    header: [
      'sticky top-0 bg-base-100 py-2 px-6 text-base font-medium mb-2 text-base-content border-b border-base-content/10 shadow-sm',
      'flex items-baseline gap-2',
    ],
    headerDesc: 'text-base-content/60 text-xs',
    content: 'px-6 pt-2 space-y-2',
  },
  // 表格样式
  table: {
    wrapper: 'w-full',
    fixedLayout: 'table-fixed',
    labelCell: 'text-xs text-base-content py-1 pl-3 w-1/3 align-top',
    valueCell: 'text-xs text-base-content/60 py-1 pr-3 text-right break-words',
    active: 'bg-primary/30!',
    subTable: 'bg-base-200 rounded-lg',
  },
  // 错误信息样式
  error:
    'p-2 bg-error/10 border-l-2 border-error rounded text-xs font-mono whitespace-pre-wrap text-error-content',
  // 关闭按钮样式
  closeButton: 'btn btn-ghost btn-circle btn-xs',
}

/** 读取播放器上下文 */
const { playerCore, source, statistics } = usePlayerContext()

// 基础类型定义
interface StreamInfo {
  [key: string]: unknown
  id: number
  mediaType: string
}

/** ==================== Player Core 信息 ==================== */
const playerCoreType = computed(() => {
  if (!playerCore.value)
    return 'unknown'
  /** 使用类型保护机制处理类型问题 */
  const core = playerCore.value as unknown as { type?: PlayerCoreType }
  return core.type ?? 'unknown'
})

/** ==================== Source 信息 ==================== */
const sourceInfoItems = computed(() => ({
  'Current Source': source?.current.value?.name || '未加载',
  'Type': source?.current.value?.type || '未知',
  'Extension': source?.current.value?.extension || 'unknown',
  'URL': source?.current.value?.url || '未加载',
}))

// ==================== Streams 信息 ====================
/** 是否有流 */
const hasStreams = computed(() => {
  if (!playerCore.value)
    return false
  const core = playerCore.value as unknown as {
    type?: PlayerCoreType
    streams?: Array<StreamInfo>
  }
  return (
    core.type === PlayerCoreType.AvPlayer
    && core.streams !== undefined
    && core.streams.length > 0
  )
})

/** 流的数量 */
const streamsCount = computed(() => {
  if (!playerCore.value)
    return 0
  const core = playerCore.value as unknown as { streams?: Array<StreamInfo> }
  return core.streams?.length ?? 0
})

/** 获取所有流 */
const streams = computed((): Array<StreamInfo> => {
  if (!playerCore.value)
    return []
  const core = playerCore.value as unknown as { streams?: Array<StreamInfo> }
  return core.streams ?? []
})

/** 判断是否是活动流 */
function isActiveStream(id: number): boolean {
  if (!playerCore.value)
    return false

  const core = playerCore.value as unknown as {
    audioStreamId?: number
    videoStreamId?: number
    subtitleStreamId?: number
  }

  const streamIds = [
    core.audioStreamId,
    core.videoStreamId,
    core.subtitleStreamId,
  ].filter(Boolean)

  return streamIds.includes(id)
}

/** 获取流的所有属性（用于渲染） */
function getStreamProperties(stream: StreamInfo) {
  const properties: Record<string, unknown> = {}

  // 支持情况
  if (playerCore.value) {
    const core = playerCore.value as unknown as {
      isSupportStream?: (stream: StreamInfo) => boolean
    }

    if (typeof core.isSupportStream === 'function') {
      properties.support = core.isSupportStream(stream) ? 'Yes' : 'No'
    }
  }

  // 编解码器ID
  if (stream.codecparProxy) {
    const codecPar = stream.codecparProxy as Record<string, unknown>
    if (codecPar.codecId) {
      properties.codecId = codecPar.codecId
    }

    // 音频通道数（仅音频流）
    if (stream.mediaType === 'Audio' && codecPar.chLayout) {
      const chLayout = codecPar.chLayout as Record<string, unknown>
      if (chLayout.nbChannels) {
        properties.nbChannels = chLayout.nbChannels
      }
    }
  }

  // 元数据
  if (stream.metadata) {
    const metadata = stream.metadata as Record<string, string>
    Object.entries(metadata).forEach(([key, value]) => {
      properties[key] = value
    })
  }

  return properties
}

// ==================== Stats 信息 ====================
/** 是否有统计信息 */
const hasStats = computed(() => {
  if (!playerCore.value)
    return false
  const core = playerCore.value as unknown as {
    stats?: Record<string, unknown>
  }
  return !!core.stats
})

/** 统计信息项目 */
const statsItems = computed(() => {
  if (!playerCore.value)
    return {}

  const core = playerCore.value as unknown as {
    stats?: Record<string, unknown>
  }
  if (!core.stats)
    return {}

  const result: Record<string, unknown> = {}
  for (const key in core.stats) {
    if (key !== 'audioCurrentTime' && key !== 'videoCurrentTime') {
      result[key] = core.stats[key]
    }
  }

  return result
})

/** 是否有音频和视频时间 */
const hasAudioVideoTimes = computed(() => {
  if (!playerCore.value)
    return false

  const core = playerCore.value as unknown as {
    stats?: Record<string, unknown>
  }
  if (!core.stats)
    return false

  return 'audioCurrentTime' in core.stats && 'videoCurrentTime' in core.stats
})

/** 音频和视频时间差 */
const audioVideoTimeDiff = computed(() => {
  if (!hasAudioVideoTimes.value || !playerCore.value)
    return 0

  const core = playerCore.value as unknown as {
    stats: {
      audioCurrentTime: number
      videoCurrentTime: number
    }
  }

  return (
    Number(core.stats.audioCurrentTime) - Number(core.stats.videoCurrentTime)
  )
})

// ==================== 错误信息 ====================
/** 是否有加载错误 */
const hasLoadError = computed(() => {
  if (!playerCore.value)
    return false
  const core = playerCore.value as unknown as { loadError?: unknown }
  return !!core.loadError
})

/** 格式化错误信息 */
const errorMessage = computed(() => {
  if (!playerCore.value)
    return ''

  const core = playerCore.value as unknown as { loadError?: unknown }
  const error = core.loadError

  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }
  return String(error || '')
})
</script>
