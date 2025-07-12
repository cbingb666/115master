/**
 * 获取图片裁剪尺寸
 * @param originalWidth 原始宽度
 * @param originalHeight 原始高度
 * @param maxWidth 最大宽度
 * @param maxHeight 最大高度
 * @returns 裁剪后的尺寸
 */
export function getImageResize(originalWidth: number, originalHeight: number, maxWidth: number, maxHeight: number): { width: number, height: number } {
  let width = originalWidth
  let height = originalHeight

  if (width > height) {
    if (width > maxWidth) {
      height = Math.round(height * (maxWidth / width))
      width = maxWidth
    }
  }
  else {
    if (height > maxHeight) {
      width = Math.round(width * (maxHeight / height))
      height = maxHeight
    }
  }

  return { width, height }
}

/**
 * 压缩图片
 */
export async function compressImage(
  /** 图片Blob */
  blob: Blob,
  /** 选项 */
  options: {
    /** 最大宽度 */
    maxWidth?: number
    /** 最大高度 */
    maxHeight?: number
    /** 质量 0-1 */
    quality?: number
    /** 类型 */
    type?: string
  } = {},
): Promise<Blob> {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8,
    type = 'image/jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      /** 创建Canvas元素 */
      const canvas = document.createElement('canvas')

      /** 计算新的尺寸，保持宽高比 */
      const { width, height } = getImageResize(
        img.width,
        img.height,
        maxWidth,
        maxHeight,
      )

      // 设置Canvas尺寸
      canvas.width = width
      canvas.height = height

      /** 绘制图像 */
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法获取Canvas上下文'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // 转换为Blob
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result)
          }
          else {
            reject(new Error('图片压缩失败'))
          }
        },
        type,
        quality,
      )
    }

    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }

    // 从Blob创建图片URL
    img.src = URL.createObjectURL(blob)
  })
}

/**
 * 将 Base64 编码的图片转换为 Blob 对象
 * @param base64 Base64
 */
export function base64ToBlob(base64: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      /** 移除可能存在的Data URL前缀 */
      const base64Data = base64.includes('base64,')
        ? base64.split('base64,')[1]
        : base64

      /** 解码Base64 */
      const byteString = atob(base64Data)

      /** 创建ArrayBuffer */
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uint8Array = new Uint8Array(arrayBuffer)

      // 填充数据
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i)
      }

      /** 确定MIME类型 */
      let mimeType = 'image/png'
      if (base64.includes('data:')) {
        const matches = base64.match(/data:([^;]+);/)
        if (matches?.[1]) {
          mimeType = matches[1]
        }
      }

      /** 创建Blob */
      const blob = new Blob([uint8Array], { type: mimeType })
      resolve(blob)
    }
    catch (error) {
      reject(error)
    }
  })
}

/**
 * 将 ImageBitmap 转换为 Blob
 * @param imageBitmap ImageBitmap
 * @param quality 质量
 */
export async function imageBitmapToBlob(imageBitmap: ImageBitmap, quality = 0.85): Promise<Blob> {
  /** 使用Canvas将ImageBitmap转换为Blob */
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('无法创建Canvas上下文')
  }

  // 绘制ImageBitmap到Canvas
  ctx.drawImage(imageBitmap, 0, 0)

  // 获取Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        }
        else {
          reject(new Error('无法创建Blob'))
        }
      },
      'image/webp',
      quality,
    )
  })
}

/**
 * 检测图像是否为黑帧
 * @param imageBitmap ImageBitmap
 */
export async function isBlackFrame(imageBitmap: ImageBitmap): Promise<boolean> {
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return false
  }

  // 绘制ImageBitmap到Canvas
  ctx.drawImage(imageBitmap, 0, 0)

  /** 获取像素数据 */
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  /** 采样步长 */
  const sampleStep = 10
  /** 亮度阈值 */
  const brightnessThreshold = 30
  /** 暗像素比例阈值 */
  const darkPixelRatio = 0.95

  let darkPixels = 0
  let totalSamples = 0
  let totalBrightness = 0

  // 遍历像素数据
  for (let y = 0; y < canvas.height; y += sampleStep) {
    for (let x = 0; x < canvas.width; x += sampleStep) {
      const i = (y * canvas.width + x) * 4
      const r = pixels[i]
      const g = pixels[i + 1]
      const b = pixels[i + 2]

      /** 计算亮度 */
      const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b
      totalBrightness += brightness

      if (brightness <= brightnessThreshold) {
        darkPixels++
      }

      totalSamples++
    }
  }

  /** 计算暗像素比例和平均亮度 */
  const darkRatio = darkPixels / totalSamples
  const avgBrightness = totalBrightness / totalSamples

  // 判断是否为黑帧
  return darkRatio >= darkPixelRatio && avgBrightness <= 25
}

/**
 * 将 Blob 转换为 base64
 * @param blob Blob
 * @returns base64
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (reader.result) {
        resolve(reader.result as string)
      }
      else {
        reject(new Error('转换Blob到Base64失败'))
      }
    }
    reader.onerror = () => {
      reject(new Error('读取Blob失败'))
    }
    reader.readAsDataURL(blob)
  })
}

/**
 * 获取图片尺寸
 * @param src 图片base64、url
 * @returns 图片尺寸
 */
export function getImageSize(
  src: string,
): Promise<{ width: number, height: number }> {
  const img = new Image()
  img.src = src
  return new Promise((resolve, reject) => {
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => {
      reject(new Error('图片加载失败'))
    }
  })
}

/**
 * 将 ImageBitmap 转换为 base64
 * @param imageBitmap ImageBitmap
 * @param quality 质量 0-1
 * @returns base64
 */
export function imageBitmapToBase64(imageBitmap: ImageBitmap, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageBitmap.width
    canvas.height = imageBitmap.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('无法创建Canvas上下文'))
      return
    }

    ctx.drawImage(imageBitmap, 0, 0)

    const base64 = canvas.toDataURL('image/webp', quality)
    resolve(base64)
  })
}
