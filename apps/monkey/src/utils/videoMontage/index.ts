import { M3U8ClipperNew } from '@/utils/clipper/m3u8Clipper'
import { drive115 } from '@/utils/drive115'
import { getImageResize } from '@/utils/image'
import { appLogger } from '@/utils/logger'

/** 日志 */
const logger = appLogger.sub('videoMontage')

/** 网格列数 */
const GRID_COLS = 3

/** 网格行数 */
const GRID_ROWS = 3

/** 截图数量（九宫格） */
const FRAME_COUNT = GRID_COLS * GRID_ROWS

/** 单个单元格最大宽度（px） */
const CELL_MAX_WIDTH = 480

/** 单个单元格最大高度（px） */
const CELL_MAX_HEIGHT = 480

/** 单元格间距（px） */
const GAP = 4

/** 外边距（px） */
const PADDING = 8

/** 头部高度（px） */
const HEADER_HEIGHT = 56

/** JPEG 质量 */
const JPEG_QUALITY = 0.92

/**
 * 生成视频九宫格合图的选项
 */
export interface VideoMontageOptions {
  /** 文件提取码 */
  pickCode: string
  /** 视频时长（秒） */
  duration: number
  /** 视频文件名（用于头部标题） */
  title?: string
  /** 进度回调（0 ~ 1） */
  onProgress?: (progress: number) => void
}

/**
 * 生成九宫格截图时间点
 * @description 均匀分布，避开视频最开头和最结尾
 * @param duration 视频时长（秒）
 */
function calcFrameTimes(duration: number): number[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) =>
    Math.floor((duration * (i + 1)) / (FRAME_COUNT + 1)))
}

/**
 * 格式化时间戳
 * @param seconds 秒
 * @returns HH:MM:SS / MM:SS
 */
function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/**
 * 在单元格内绘制时间戳标签
 */
function drawTimestamp(
  ctx: OffscreenCanvasRenderingContext2D,
  text: string,
  cellX: number,
  cellY: number,
  cellW: number,
  cellH: number,
): void {
  const fontSize = Math.max(12, Math.round(cellH * 0.07))
  ctx.font = `600 ${fontSize}px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  const paddingX = 6
  const paddingY = 4
  const x = cellX + cellW - paddingX
  const y = cellY + cellH - paddingY

  const metrics = ctx.measureText(text)
  const bgW = metrics.width + paddingX * 2
  const bgH = fontSize + paddingY * 2

  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
  ctx.fillRect(x - metrics.width - paddingX, y - fontSize - paddingY, bgW, bgH)

  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x, y)
}

/**
 * 生成视频九宫格合图
 * @description 使用 HLS 流解析视频帧，采集 9 帧拼成 3x3 网格合图
 * @returns JPEG 格式的图片 Blob
 */
export async function generateVideoMontage(
  options: VideoMontageOptions,
): Promise<Blob> {
  const { pickCode, duration, title, onProgress } = options

  if (!duration || duration <= 0) {
    throw new Error('视频时长无效，无法生成合图')
  }

  /** 获取 m3u8 列表，取最低画质用于快速解析 */
  const m3u8List = await drive115.getM3u8(pickCode)
  const source = m3u8List.sort((a, b) => a.quality - b.quality)[0]
  if (!source) {
    throw new Error('无法获取视频转码源（可能未转码）')
  }

  const clipper = new M3U8ClipperNew({ url: source.url })
  await clipper.open()

  try {
    const times = calcFrameTimes(duration)

    /** 采集所有帧的位图 */
    const bitmaps: (ImageBitmap | null)[] = []
    let firstW = 0
    let firstH = 0

    for (let i = 0; i < times.length; i++) {
      try {
        const result = await clipper.seek(times[i], true)
        if (result) {
          const bitmap = await createImageBitmap(result.videoFrame)
          result.videoFrame.close()
          bitmaps.push(bitmap)
          if (!firstW) {
            firstW = bitmap.width
            firstH = bitmap.height
          }
        }
        else {
          bitmaps.push(null)
        }
      }
      catch (error) {
        logger.warn(`采集第 ${i + 1} 帧失败`, error)
        bitmaps.push(null)
      }
      onProgress?.((i + 1) / times.length)
    }

    if (!firstW || !firstH) {
      throw new Error('未能采集到任何视频帧')
    }

    /** 依据首帧比例计算单元格尺寸 */
    const cell = getImageResize(firstW, firstH, CELL_MAX_WIDTH, CELL_MAX_HEIGHT)
    const cellW = cell.width
    const cellH = cell.height

    const gridW = GRID_COLS * cellW + (GRID_COLS - 1) * GAP
    const gridH = GRID_ROWS * cellH + (GRID_ROWS - 1) * GAP
    const canvasW = gridW + PADDING * 2
    const canvasH = gridH + PADDING * 2 + HEADER_HEIGHT

    const canvas = new OffscreenCanvas(canvasW, canvasH)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法创建画布上下文')
    }

    /** 背景 */
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasW, canvasH)

    /** 头部信息 */
    if (title) {
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.font = '600 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
      const maxTitleWidth = canvasW - PADDING * 2 - 160
      let displayTitle = title
      while (
        ctx.measureText(displayTitle).width > maxTitleWidth
        && displayTitle.length > 4
      ) {
        displayTitle = displayTitle.slice(0, -2)
      }
      if (displayTitle !== title) {
        displayTitle += '…'
      }
      ctx.fillText(displayTitle, PADDING, HEADER_HEIGHT / 2)

      /** 时长 */
      ctx.textAlign = 'right'
      ctx.fillStyle = '#9ca3af'
      ctx.font = '400 16px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
      ctx.fillText(
        `时长 ${formatTimestamp(duration)}`,
        canvasW - PADDING,
        HEADER_HEIGHT / 2,
      )
    }

    /** 绘制每一帧 */
    for (let i = 0; i < FRAME_COUNT; i++) {
      const col = i % GRID_COLS
      const row = Math.floor(i / GRID_COLS)
      const cellX = PADDING + col * (cellW + GAP)
      const cellY = HEADER_HEIGHT + PADDING + row * (cellH + GAP)

      /** 单元格背景 */
      ctx.fillStyle = '#000000'
      ctx.fillRect(cellX, cellY, cellW, cellH)

      const bitmap = bitmaps[i]
      if (bitmap) {
        ctx.drawImage(bitmap, cellX, cellY, cellW, cellH)
        bitmap.close()
        drawTimestamp(ctx, formatTimestamp(times[i]), cellX, cellY, cellW, cellH)
      }
    }

    return await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: JPEG_QUALITY,
    })
  }
  finally {
    clipper.destroy()
  }
}
