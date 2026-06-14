export interface SizeResult {
  width: number
  height: number
}

/**
 * 加载图片并返回其原始尺寸
 */
export function size(src: string): Promise<SizeResult> {
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
 * 判断是否为竖向图片
 */
export function isPortrait(width: number, height: number): boolean {
  return width < height
}
