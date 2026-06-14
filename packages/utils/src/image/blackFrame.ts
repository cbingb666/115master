export interface BlackFrameOptions {
  /** 亮度阈值，默认 30 */
  brightnessThreshold?: number
  /** 判定为黑帧的暗像素占比阈值，默认 0.95 */
  darkPixelRatio?: number
  /** 采样步长，默认 2 */
  sampleStep?: number
  /** 平均亮度阈值，默认 25 */
  avgBrightnessThreshold?: number
  /** 中心区域权重，默认 0.6 */
  centerWeight?: number
}

interface Region {
  startX: number
  startY: number
  endX: number
  endY: number
}

function getCenterRegion(width: number, height: number): Region {
  const centerWidth = Math.floor(width * 0.6)
  const centerHeight = Math.floor(height * 0.6)
  const startX = Math.floor((width - centerWidth) / 2)
  const startY = Math.floor((height - centerHeight) / 2)

  return {
    startX,
    startY,
    endX: startX + centerWidth,
    endY: startY + centerHeight,
  }
}

function isInCenterRegion(x: number, y: number, width: number, height: number): boolean {
  const { startX, startY, endX, endY } = getCenterRegion(width, height)
  return x >= startX && x <= endX && y >= startY && y <= endY
}

function analyzeImageData(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: BlackFrameOptions,
): boolean {
  const {
    brightnessThreshold = 30,
    darkPixelRatio = 0.95,
    sampleStep = 2,
    avgBrightnessThreshold = 25,
    centerWeight = 0.6,
  } = options

  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  let darkPixels = 0
  let centerDarkPixels = 0
  let totalCenterPixels = 0
  let totalSamples = 0
  let totalBrightness = 0

  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
      totalBrightness += brightness

      const isCenter = isInCenterRegion(x, y, width, height)

      if (brightness <= brightnessThreshold) {
        darkPixels++
        if (isCenter)
          centerDarkPixels++
      }

      if (isCenter)
        totalCenterPixels++

      totalSamples++
    }
  }

  const avgBrightness = totalBrightness / totalSamples
  const darkRatio = darkPixels / totalSamples
  const centerDarkRatio = centerDarkPixels / totalCenterPixels

  return (
    darkRatio >= darkPixelRatio
    && centerDarkRatio >= darkPixelRatio * centerWeight
    && avgBrightness <= avgBrightnessThreshold
  )
}

function analyzeBitmap(imageBitmap: ImageBitmap, options: BlackFrameOptions): boolean {
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx)
    return false

  ctx.drawImage(imageBitmap, 0, 0)
  return analyzeImageData(ctx, canvas.width, canvas.height, options)
}

function analyzeImageSource(src: string, options: BlackFrameOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'))
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        resolve(analyzeImageData(ctx, img.width, img.height, options))
      }
      catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = src
  })
}

/**
 * 判断图片是否为黑帧
 * @param source ImageBitmap 或图片地址（支持 URL 与 Base64）
 */
export function isBlackFrame(source: ImageBitmap, options?: BlackFrameOptions): Promise<boolean>
export function isBlackFrame(source: string, options?: BlackFrameOptions): Promise<boolean>
export function isBlackFrame(source: ImageBitmap | string, options: BlackFrameOptions = {}): Promise<boolean> {
  if (source instanceof ImageBitmap)
    return Promise.resolve(analyzeBitmap(source, options))

  return analyzeImageSource(source as string, options)
}
