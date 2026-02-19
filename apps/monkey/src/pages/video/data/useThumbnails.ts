import type { usePreferences } from './usePreferences'
import type {
  ThumbnailFrame,
  VideoSource,
} from '@/components/XPlayer/types'
import type { LaneConfig } from '@/utils/scheduler'
import { tryOnUnmounted } from '@vueuse/core'
import { chain } from 'lodash'
import { shallowRef } from 'vue'
import { FRIENDLY_ERROR_MESSAGE } from '@/constants'
import { intervalArray } from '@/utils/array'
import { M3U8ClipperNew } from '@/utils/clipper/m3u8Clipper'
import { getImageResize } from '@/utils/image'
import { appLogger } from '@/utils/logger'
import {

  Scheduler,
  SchedulerError,
} from '@/utils/scheduler'
import { blurTime } from '@/utils/time'

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

/** 默认最大采样间隔 */
const DEFAULT_SAMPLING_INTERVAL = 30

/** 最小采样间隔（秒） */
const MIN_SAMPLING_INTERVAL = 2

/** 最小采样数量 */
const MIN_SAMPLING_COUNT = 160

/** 最大采样数量 */
const MAX_SAMPLING_COUNT = 300

/** 日志名称 */
const LOGGER_NAME = 'useDataThumbnails'

/** 日志 */
const logger = appLogger.sub(LOGGER_NAME)

/** 使用缓存 */
function useCache() {
  /** 缓存缩略图 */
  const cache = new Map<number, ThumbnailFrame>()

  /** 获取缓存 */
  const getCache = (time: number) => {
    return cache.get(time)
  }

  /** 是否存在缓存 */
  const hasCache = (time: number) => {
    return cache.has(time)
  }

  /** 设置缓存 */
  const setCache = (time: number, thumbnail: ThumbnailFrame) => {
    const cacheOld = cache.get(time)
    if (cacheOld) {
      cacheOld.img?.close()
    }
    cache.set(time, thumbnail)
  }

  /** 释放缓存 */
  const releaseCache = () => {
    cache.forEach((thumbnail) => {
      thumbnail?.img?.close()
    })
    cache.clear()
  }

  return {
    getCache,
    hasCache,
    setCache,
    releaseCache,
  }
}

/**
 * 缩略图生成
 * @param preferences 偏好设置
 */
export function useDataThumbnails(
  preferences: ReturnType<typeof usePreferences>,
) {
  const currentId = shallowRef<string | undefined>(undefined)

  /** 缩略图生成器 */
  let clipper: M3U8ClipperNew

  /** 初始化缩略图生成器 Promise */
  let initializePromise: ReturnType<typeof initializeImpl>

  /** 任务调度器 */
  const scheduler = new Scheduler<ThumbnailFrame | null>(SCHEDULER_OPTIONS)

  /** 初始化缩略图生成器 */
  const isInited = shallowRef(false)

  /** 是否执行过自动缓冲 */
  const isAutoBufferExecuted = shallowRef(false)

  /** 初始的采样间隔 */
  const initialSamplingInterval = shallowRef(DEFAULT_SAMPLING_INTERVAL)

  /** 采样间隔 */
  const samplingInterval = shallowRef(DEFAULT_SAMPLING_INTERVAL)

  /** 缓存 */
  const {
    getCache,
    hasCache,
    setCache,
    releaseCache,
  } = useCache()

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

  /**
   * 动态计算采样间隔
   * @description 根据视频时长和传入的间隔，动态调整采样间隔，确保生成的缩略图数量不会太少
   * @param duration 视频时长（秒）
   * @param maxSimplingInterval 最大采样间隔（秒）
   * @returns 调整后的采样间隔（秒）
   */
  const calculateSamplingInterval = (
    duration: number,
    maxSimplingInterval: number,
  ): number => {
    const count = Math.max(MIN_SAMPLING_COUNT, Math.min(duration / maxSimplingInterval, MAX_SAMPLING_COUNT))
    return Math.max(MIN_SAMPLING_INTERVAL, Math.min(duration / count, maxSimplingInterval))
  }

  /**
   * 初始化缩略图生成器( 内部实现 )
   * @param id 唯一标识 (可以是 pickcode )
   * @param sources 视频源
   * @param interval 缩略图最大采样间隔
   */
  const initializeImpl = async (id: string, sources: VideoSource[], interval: number) => {
    currentId.value = id
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

      /** 动态计算采样间隔，根据视频时长调整 */
      initialSamplingInterval.value = interval ?? DEFAULT_SAMPLING_INTERVAL
      samplingInterval.value = calculateSamplingInterval(
        clipper.hlsIo.duration,
        initialSamplingInterval.value,
      )

      logger.info('初始化缩略图生成器完成，信息如下:')
      console.table({
        'M3U8 分片数量': clipper.hlsIo.segments.length,
        'M3U8 总时长(s)': clipper.hlsIo.duration,
        '最大采样间隔(s)': initialSamplingInterval.value,
        '实际采样间隔(s)': samplingInterval.value,
        '需要采集的缩略图数量': Math.ceil(clipper.hlsIo.duration / samplingInterval.value),
      })

      isInited.value = true
    }
    catch (error) {
      if (currentId.value !== id) {
        return
      }
      state.value.error = error
    }
  }

  /**
   * 初始化缩略图生成器
   */
  const initialize = (...args: Parameters<typeof initializeImpl>) => {
    initializePromise = initializeImpl(...args)
    return initializePromise
  }

  /**
   * 获取指定时间点的缩略图
   * @description 获取指定时间点的缩略图，根据模糊处理后的时间，请求缩略图，并返回缩略图
   * @param id 唯一标识 (可以是 pickcode )
   * @param seekTime 实际时间
   * @param seekBlurTime 模糊处理后的时间
   * @returns 缩略图
   */
  const seekThumbnail = async (
    id: string,
    seekTime: number,
    seekBlurTime: number,
  ): Promise<ThumbnailFrame> => {
    const subLogger = logger.sub(`seekThumbnail ${seekBlurTime}s`)
    subLogger.enableSilentMode()
    try {
      if (!isInited.value && initializePromise) {
        await initializePromise
      }
      const result = await clipper.seek(seekBlurTime, false, samplingInterval.value, subLogger)
      if (!result) {
        throw new Error('no find frame')
      }

      if (currentId.value !== id) {
        result.videoFrame.close()
        return
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
      result.videoFrame.close()

      // DEBUG INFO
      subLogger.debug(`
        ## seekThumbnail
        seekTime: ${seekTime}
        seekBlurTime: ${seekBlurTime}
        samplingInterval: ${samplingInterval.value}
        consumedTime: ${result.consumedTime}
        frameTime: ${result.frameTime}
      `)

      setCache(seekBlurTime, thumbnail)
      // 返回缩略图
      return thumbnail
    }
    catch (error) {
      subLogger.error('seekThumbnail error', error)
      subLogger.printLogsUsingTable('seekThumbnail error, print logs 👇')
      throw error
    }
    finally {
      subLogger.clearLogs()
    }
  }

  /**
   * 处理来自播放器的缩略图请求
   * @description 处理来自播放器的缩略图请求，如果不是最后一次请求，则返回缓存中的缩略图
   */
  const onThumbnailRequest = async (options: {
    id: string
    time: number
    isLast: boolean
  } = {
    id: '',
    time: 0,
    isLast: false,
  }): Promise<ThumbnailFrame> => {
    const { id, time, isLast } = options

    if (Number.isNaN(time)) {
      throw new TypeError('Invalid time')
    }

    if (state.value.error) {
      throw state.value.error
    }

    /** 计算请求时间 */
    const seekBlurTime = blurTime(
      time,
      samplingInterval.value,
      clipper.hlsIo.duration,
    )

    /** 如果缓存中存在，则返回缓存 */
    const cache = getCache(seekBlurTime)
    if (cache) {
      return cache
    }

    if (!isLast) {
      return
    }

    // 请求缩略图
    return await seekThumbnail(id, time, seekBlurTime)
  }

  /** 自动加载缩略图 */
  const autoBuffer = async (id: string) => {
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

    /** 如果未初始化，则等待初始化完成 */
    if (!isInited.value && initializePromise) {
      await initializePromise
    }

    /** 获取所有缩略图时间点 */
    const times = chain(intervalArray(0, clipper.hlsIo.duration, samplingInterval.value))
      .filter(time => !hasCache(time))
      .shuffle()
      .value()

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
            if (hasCache(seekTime)) {
              return null
            }
            return await seekThumbnail(id, time, seekTime)
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
          if (!(error instanceof SchedulerError.QueueCleared)) {
            throw error
          }
        })
    }
  }

  /** clear */
  const destory = () => {
    clipper?.destroy()
    scheduler.clear()
    releaseCache()
    isInited.value = false
    isAutoBufferExecuted.value = false
  }

  tryOnUnmounted(() => {
    destory()
  })

  return {
    isInited,
    isAutoBufferExecuted,
    initialize,
    autoBuffer,
    onThumbnailRequest,
    destory,
  }
}
