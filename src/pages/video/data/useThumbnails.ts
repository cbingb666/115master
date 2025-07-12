import type {
  ThumbnailFrame,
  VideoSource,
} from '../../../components/XPlayer/types'
import type { LaneConfig } from '../../../utils/scheduler'
import type { usePreferences } from './usePreferences'
import { tryOnUnmounted } from '@vueuse/core'
import { shuffle } from 'lodash'
import { shallowRef } from 'vue'
import { FRIENDLY_ERROR_MESSAGE } from '../../../constants'
import { intervalArray } from '../../../utils/array'
import { M3U8ClipperNew } from '../../../utils/clipper/m3u8Clipper'
import { getImageResize } from '../../../utils/image'
import {

  Scheduler,
  SchedulerError,
} from '../../../utils/scheduler'
import { blurTime } from '../../../utils/time'

/** 缩略图生成器配置 */
const CLIPPER_OPTIONS = {
  maxWidth: 320,
  maxHeight: 320,
}

/** 车道配置 */
const LANE_CONFIG: Record<string, LaneConfig> = {
  // 缓冲车道
  buffer: {
    name: 'buffer',
    priority: 2,
    maxConcurrent: 4,
  },
}

/** 任务调度器配置 */
const SCHEDULER_OPTIONS = {
  // 最大并发数
  maxConcurrent: 4,
  // 最大队列长度
  maxQueueLength: 1000,
  // 车道配置
  laneConfig: LANE_CONFIG,
}

/** 默认采样间隔 */
const DEFAULT_SAMPLING_INTERVAL = 30

export function useDataThumbnails(
  preferences: ReturnType<typeof usePreferences>,
) {
  /** 缩略图生成器 */
  let clipper: M3U8ClipperNew

  /** 任务调度器 */
  const scheduler = new Scheduler<ThumbnailFrame | null>(SCHEDULER_OPTIONS)

  /** 初始化缩略图生成器 */
  const isInited = shallowRef(false)

  /** 是否执行过自动缓冲 */
  const isAutoBufferExecuted = shallowRef(false)

  /** 采样间隔 */
  const samplingInterval = shallowRef(DEFAULT_SAMPLING_INTERVAL)

  /** 缓存缩略图 */
  const cahceThumbnails = new Map<number, ThumbnailFrame>()

  /** 错误 */
  const state = shallowRef<{
    error: Error | unknown | undefined
  }>({
    error: undefined,
  })

  /** 找到最低画质的 HLS 源 */
  const findLowestQualityHLS = (sources: VideoSource[]): VideoSource | null => {
    let lowestQuality: VideoSource | null = null
    sources.forEach((source) => {
      if (source.type === 'hls') {
        if (!lowestQuality || source.quality < lowestQuality.quality) {
          lowestQuality = source
        }
      }
    })
    return lowestQuality
  }

  /** 初始化缩略图生成器 */
  const initialize = async (sources: VideoSource[], interval: number) => {
    try {
      isInited.value = false
      const source = findLowestQualityHLS(sources)
      if (!source) {
        throw FRIENDLY_ERROR_MESSAGE.CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING
      }
      clipper = new M3U8ClipperNew({
        url: source.url,
      })
      await clipper.open()
      samplingInterval.value = interval ?? DEFAULT_SAMPLING_INTERVAL
      isInited.value = true
    }
    catch (error) {
      state.value.error = error
    }
  }

  /**
   * 获取指定时间点的缩略图
   */
  const seekThumbnail = async (
    seekTime: number,
    seekBlurTime: number,
  ): Promise<ThumbnailFrame> => {
    const result = await clipper.seek(seekBlurTime, true)
    if (!result) {
      return undefined
    }

    /** 获取缩略图尺寸 */
    const resize = getImageResize(
      result.videoFrame.displayWidth,
      result.videoFrame.displayHeight,
      CLIPPER_OPTIONS.maxWidth,
      CLIPPER_OPTIONS.maxHeight,
    )

    /** 创建缩略图 */
    const imageBitmap = await createImageBitmap(result.videoFrame, {
      resizeQuality: 'pixelated',
      resizeWidth: resize.width,
      resizeHeight: resize.height,
    })
    const thumbnail: ThumbnailFrame = {
      img: imageBitmap,
      seekTime,
      seekBlurTime,
      frameTime: result.frameTime,
      consumedTime: result.consumedTime,
    }

    // 缓存缩略图
    cahceThumbnails.set(seekBlurTime, thumbnail)

    // 返回缩略图
    return thumbnail
  }

  /** 获取指定时间点的缩略图 */
  const onThumbnailRequest = async ({
    time,
    isLast,
  }: {
    time: number
    isLast: boolean
  }): Promise<ThumbnailFrame> => {
    if (state.value.error) {
      throw state.value.error
    }

    if (!isInited || Number.isNaN(time)) {
      return
    }

    /** 计算请求时间 */
    const seekBlurTime = blurTime(
      time,
      samplingInterval.value,
      clipper.hlsIo.duration,
    )

    /** 如果缓存中存在，则返回缓存 */
    const cache = cahceThumbnails.get(seekBlurTime)
    if (cache) {
      return cache
    }

    if (!isLast) {
      return
    }

    // 请求缩略图
    return await seekThumbnail(time, seekBlurTime)
  }

  /** 自动加载缩略图 */
  const autoBuffer = async () => {
    if (state.value.error) {
      throw state.value.error
    }

    // 如果禁用了自动加载预览图
    if (preferences.value.autoLoadThumbnails === false) {
      return
    }

    // 如果已经执行过自动加载预览图
    if (isAutoBufferExecuted.value) {
      return
    }

    // 设置为已执行
    isAutoBufferExecuted.value = true

    /** 获取所有缩略图时间点 */
    const times
      // 打乱顺序
      = shuffle(
        // 生成缩略图时间点
        intervalArray(0, clipper.hlsIo.duration, samplingInterval.value)
        // 过滤已缓存的缩略图
          .filter(time => !cahceThumbnails.has(time)),
      )

    // 添加任务
    for (const time of times) {
      scheduler
        .add(
          async () => {
            const seekTime = blurTime(
              time,
              samplingInterval.value,
              clipper.hlsIo.duration,
            )
            // 如果缓存中存在，则不请求
            if (cahceThumbnails.has(seekTime)) {
              return null
            }
            return await seekThumbnail(time, seekTime)
          },
          {
            id: time.toString(),
            lane: LANE_CONFIG.buffer.name,
            priority: 1,
            immediate: true,
            action: 'unshift',
          },
        )
        .catch((error) => {
          if (error instanceof SchedulerError.QueueCleared) {
            throw error
          }
        })
    }
  }

  /** 释放缓存 */
  const releaseCache = () => {
    cahceThumbnails.forEach((thumbnail) => {
      thumbnail?.img?.close()
    })
    cahceThumbnails.clear()
  }

  /** clear */
  const clear = () => {
    clipper.destroy()
    scheduler.clear()
    releaseCache()
    isInited.value = false
    isAutoBufferExecuted.value = false
  }

  tryOnUnmounted(() => {
    clear()
  })

  return {
    isInited,
    isAutoBufferExecuted,
    initialize,
    autoBuffer,
    onThumbnailRequest,
    clear,
  }
}
