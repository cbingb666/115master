import type { Ref } from 'vue'
import { useElementVisibility, useScroll } from '@vueuse/core'
import { onUnmounted, reactive, watch } from 'vue'
import { FRIENDLY_ERROR_MESSAGE } from '../../constants'
import { videoCoverCache } from '../../utils/cache'
import { M3U8ClipperNew } from '../../utils/clipper/m3u8Clipper'
import { drive115 } from '../../utils/drive115'
import { Drive115Error } from '../../utils/drive115/core'
import { getImageResize } from '../../utils/image'
import { Scheduler, SchedulerError, TaskStatus } from '../../utils/scheduler'

/** 最大宽度 */
const MAX_WIDTH = 720

/** 最大高度 */
const MAX_HEIGHT = 720

/** 视频封面调度器 */
const videoCoverScheduler = new Scheduler<VideoCover[]>({
  maxConcurrent: 3,
})

/** 视频封面基础数据 */
interface VideoCoverBase {
  /** 宽度 */
  width: number
  /** 高度 */
  height: number
  /** 帧实际时间（秒） */
  frameTime: number
  /** 跳转时间（秒） */
  seekTime: number
}

/**
 * 视频封面原始数据
 */
export type VideoCoverRaw = VideoCoverBase & {
  /** 图片 blob */
  blob: Blob
}

/**
 * 视频封面数据
 */
export type VideoCover = VideoCoverBase & {
  /** 图片 blob URL */
  img: string
}

/**
 * 视频封面选项
 */
export interface VideoCoverOptions {
  /** sha1 */
  sha1: string
  /** 文件提取码 */
  pickCode: string
  /** 数量 */
  coverNum: number
  /** 持续时间 */
  duration: number
}

/**
 * 智能加载配置
 */
export interface SmartLoadConfig {
  /** 元素可见性检测的根元素 */
  elementRef: Ref<HTMLElement | undefined>
  /** 额外的可见性条件（如父容器可见性） */
  additionalVisible?: Ref<boolean>
  /** 滚动容器（用于优化可见性检测和滚动防抖） */
  scrollTarget?: Ref<HTMLElement | undefined> | HTMLElement
  /** 可见性检测的阈值 */
  threshold?: number
  /** 根边距 */
  rootMargin?: string
}

/**
 * 生成任务ID
 */
function generateTaskId(options: VideoCoverOptions): string {
  return `cover_${options.sha1}_${options.pickCode}_${options.coverNum}_${options.duration}`
}

/**
 * 获取缓存键
 */
const getCacheKey = (sha1: string, time: number): string => `${sha1}_${time}`

/**
 * 计算视频封面时间点
 * @param duration 视频时长
 * @param coverNum 封面数量
 * @returns 视频封面时间点数组
 */
function calculateVideoCoverTimes(duration: number, coverNum: number): number[] {
  /** 偏移量 */
  const offset = duration / 5
  /** 获取最小时间 */
  const minTime = offset
  /** 获取最大时间 */
  const maxTime = duration - offset
  /** 范围 */
  const range = maxTime - minTime

  // 计算时间
  return Array.from({ length: coverNum }, (_, i) =>
    Math.floor(minTime + (range / coverNum) * i))
}

/**
 * 将数据转换为可显示数据
 */
function toDisplayableData(rawData: VideoCoverRaw): VideoCover {
  return {
    img: URL.createObjectURL(rawData.blob),
    ...rawData,
  }
}

/**
 * 生成单个视频封面原始数据
 */
async function generateVideoCoverRaw(clipper: M3U8ClipperNew, time: number): Promise<VideoCoverRaw> {
  /** 获取截图 */
  const result = await clipper.seek(time, true)
  if (!result) {
    throw new Error('no clipper result')
  }

  /** 缩放 */
  const resize = getImageResize(
    result.videoFrame.displayWidth,
    result.videoFrame.displayHeight,
    MAX_WIDTH,
    MAX_HEIGHT,
  )

  /** 使用 OffscreenCanvas */
  const canvas = new OffscreenCanvas(resize.width, resize.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('no canvas context')
  }

  // 绘制
  ctx.drawImage(
    await createImageBitmap(result.videoFrame, {
      resizeQuality: 'pixelated',
      resizeWidth: resize.width,
      resizeHeight: resize.height,
    }),
    0,
    0,
    resize.width,
    resize.height,
  )

  /** 转换成 blob */
  const blob = await canvas.convertToBlob({
    type: 'image/webp',
    quality: 0.85,
  })

  // 关闭
  result.videoFrame.close()

  /** 缓存 blob 数据 */
  const raw: VideoCoverRaw = {
    blob,
    width: resize.width,
    height: resize.height,
    frameTime: result.frameTime,
    seekTime: time,
  }
  return raw
}

/**
 * 从缓存获取视频封面
 */
async function getVideoCoversFromCache(sha1: string, times: number[]): Promise<VideoCover[]> {
  const covers: VideoCover[] = []
  for (const time of times) {
    const cacheKey = getCacheKey(sha1, time)
    const cache = await videoCoverCache.get(cacheKey)
    if (!cache) {
      return []
    }
    const cacheData = cache.value
    covers.push(toDisplayableData(cacheData))
  }
  return covers
}

/**
 * 获取视频封面
 */
async function getVideoCover(sha1: string, pickCode: string, times: number[]): Promise<VideoCover[]> {
  /** 获取 m3u8 列表 */
  const m3u8List = await drive115.getM3u8(pickCode)

  /** 获取源 */
  const source = m3u8List.sort((a, b) => a.quality - b.quality)[0]
  if (!source) {
    throw new Error('source is null')
  }

  /** 创建 clipper */
  const clipper = new M3U8ClipperNew({
    url: source.url,
  })

  // 打开 clipper
  await clipper.open()

  /** 获取每个时间点的视频封面 */
  const promises = times.map(async (time) => {
    const cacheKey = getCacheKey(sha1, time)
    const raw = await generateVideoCoverRaw(clipper, time)
    videoCoverCache.set(cacheKey, raw)
    return toDisplayableData(raw)
  })

  // 返回用于显示的数据
  return Promise.all(promises)
}

/**
 * 清理 blob URL
 */
function cleanupBlobUrl(covers: string[]): void {
  covers.forEach((cover) => {
    if (cover.startsWith('blob:')) {
      URL.revokeObjectURL(cover)
    }
  })
}

/**
 * 智能视频封面 Hook
 * @description 带滚动加载
 */
export function useSmartVideoCover(options: Ref<VideoCoverOptions>, config: SmartLoadConfig) {
  /** 数据 */
  const videoCover = reactive<{
    isReady: boolean
    isLoading: boolean
    error: unknown
    state: VideoCover[]
  }>({
    isReady: false,
    isLoading: false,
    error: undefined,
    state: [],
  })

  /** 任务ID */
  const taskId = generateTaskId(options.value)

  /** 时间点 */
  const times = calculateVideoCoverTimes(
    options.value.duration,
    options.value.coverNum,
  )

  /** 可见性 */
  const visibility = useElementVisibility(config.elementRef, {
    threshold: config.threshold ?? 0,
    rootMargin: config.rootMargin ?? '0%',
    scrollTarget: config.scrollTarget,
  })

  /** 添加任务 */
  const addTask = (
    id: string,
    sha1: string,
    pickCode: string,
    times: number[],
  ) => {
    return videoCoverScheduler.add(
      () => {
        return getVideoCover(sha1, pickCode, times)
      },
      {
        id,
        immediate: true,
      },
    )
  }

  /** 取消任务 */
  const cancelTask = () => {
    const task = videoCoverScheduler.get(taskId)
    if (task && task.status === TaskStatus.Pending) {
      videoCoverScheduler.cancel(taskId)
    }
  }

  /**
   * 获取数据
   */
  const getData = async (id: string, options: VideoCoverOptions) => {
    if (videoCover.isReady || videoCover.error) {
      return
    }

    const task = videoCoverScheduler.get(id)
    if (task) {
      return
    }
    videoCover.isLoading = true
    try {
      const data = await addTask(id, options.sha1, options.pickCode, times)
      videoCover.state = data
      videoCover.isReady = true
    }
    catch (error) {
      if (error instanceof SchedulerError.TaskCancelled) {
        return
      }
      if (error instanceof Drive115Error.NotFoundM3u8File) {
        videoCover.error
          = FRIENDLY_ERROR_MESSAGE.CANNOT_VIDEO_COVER_WITHOUT_TRANSCODING
        return
      }
      videoCover.error = error
    }
    finally {
      videoCover.isLoading = false
    }
  }

  /** 从缓存获取数据 */
  const getDataByCache = async (options: VideoCoverOptions) => {
    if (videoCover.isReady || videoCover.error) {
      return
    }

    videoCover.isLoading = true
    try {
      const data = await getVideoCoversFromCache(options.sha1, times)
      if (data.length > 0) {
        videoCover.state = data
        videoCover.isLoading = false
        videoCover.isReady = true
      }
    }
    catch (error) {
      videoCover.error = error
    }
    finally {
      videoCover.isLoading = false
    }
  }

  /** 滚动 */
  const { isScrolling } = useScroll(config.scrollTarget, {
    throttle: 1000 / 60,
    idle: 100,
    onStop: async () => {
      if (visibility.value) {
        await getDataByCache(options.value)
        getData(taskId, options.value)
      }
    },
  })

  /** 监听可见性 */
  watch(visibility, async (value) => {
    if (value) {
      if (isScrolling.value) {
        getDataByCache(options.value)
      }
      else {
        await getDataByCache(options.value)
        getData(taskId, options.value)
      }
    }
    else {
      cancelTask()
    }
  })

  /** 卸载 */
  onUnmounted(() => {
    videoCoverScheduler.remove(taskId)
    cleanupBlobUrl(
      videoCover.state
        .map(item => item?.img)
        .filter(item => item !== undefined),
    )
  })

  return {
    videoCover,
  }
}
