/**
 * 判断图片是否为黑帧的配置选项
 */
interface BlackFrameOptions {
  /** 亮度阈值，默认为 30（0-255） */
  brightnessThreshold?: number
  /** 判定为黑帧的暗像素占比阈值，默认为 0.98（98%） */
  darkPixelRatio?: number
  /** 采样步长，每隔多少个像素采样一次，默认为 2 */
  sampleStep?: number
  /** 平均亮度阈值，默认为 20 */
  avgBrightnessThreshold?: number
  /** 中心区域权重，默认为 0.6 */
  centerWeight?: number
}

/**
 * 获取图片中心区域的范围
 */
function getCenterRegion(width: number, height: number) {
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

/**
 * 判断坐标是否在中心区域
 */
function isInCenterRegion(x: number, y: number, width: number, height: number): boolean {
  const { startX, startY, endX, endY } = getCenterRegion(width, height)
  return x >= startX && x <= endX && y >= startY && y <= endY
}

/**
 * 分析图片数据判断是否为黑帧
 */
function analyzeImageData(ctx: CanvasRenderingContext2D, width: number, height: number, options: BlackFrameOptions): boolean {
  const {
    brightnessThreshold = 30,
    darkPixelRatio = 0.95, // 降低暗像素比例要求
    sampleStep = 2,
    avgBrightnessThreshold = 25, // 提高平均亮度阈值
    centerWeight = 0.6,
  } = options

  /** 获取像素数据 */
  const imageData = ctx.getImageData(0, 0, width, height)
  const pixels = imageData.data

  let darkPixels = 0
  let centerDarkPixels = 0
  let totalCenterPixels = 0
  let totalSamples = 0
  let totalBrightness = 0

  // 遍历像素数据
  for (let y = 0; y < height; y += sampleStep) {
    for (let x = 0; x < width; x += sampleStep) {
      const i = (y * width + x) * 4
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      /** 计算亮度 (使用相对亮度公式) */
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
      totalBrightness += brightness

      const isCenter = isInCenterRegion(x, y, width, height)

      if (brightness <= brightnessThreshold) {
        darkPixels++
        if (isCenter) {
          centerDarkPixels++
        }
      }

      if (isCenter) {
        totalCenterPixels++
      }

      totalSamples++
    }
  }

  /** 计算各项指标 */
  const avgBrightness = totalBrightness / totalSamples
  const darkRatio = darkPixels / totalSamples
  const centerDarkRatio = centerDarkPixels / totalCenterPixels

  // 综合判断是否为黑帧
  return (
    darkRatio >= darkPixelRatio
    && centerDarkRatio >= darkPixelRatio * centerWeight
    && avgBrightness <= avgBrightnessThreshold
  )
}

/**
 * 同步判断 base64 图片是否为黑帧
 * @param base64 base64格式的图片数据
 * @param options 配置选项
 * @returns Promise<boolean>
 */
export function isBlackFrameFromBase64(base64: string, options: BlackFrameOptions = {}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    /** 创建离屏 Canvas */
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'))
      return
    }

    /** 创建图片对象 */
    const img = new Image()

    img.onload = () => {
      try {
        // 设置 Canvas 尺寸
        canvas.width = img.width
        canvas.height = img.height

        // 绘制图片
        ctx.drawImage(img, 0, 0)

        // 分析图片数据
        resolve(analyzeImageData(ctx, img.width, img.height, options))
      }
      catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = base64
  })
}

/**
 * 异步判断图片URL是否为黑帧
 * @param imageUrl 图片URL
 * @param options 配置选项
 * @returns Promise<boolean>
 */
export async function isBlackFrame(imageUrl: string, options: BlackFrameOptions = {}): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        /** 创建 Canvas */
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          throw new Error('无法创建 Canvas 上下文')
        }

        // 设置 Canvas 尺寸
        canvas.width = img.width
        canvas.height = img.height

        // 绘制图片
        ctx.drawImage(img, 0, 0)

        // 分析图片数据
        resolve(analyzeImageData(ctx, img.width, img.height, options))
      }
      catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    img.src = imageUrl
  })
}
