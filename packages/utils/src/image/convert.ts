/**
 * 将 Base64 编码的图片转换为 Blob 对象
 */
export function base64ToBlob(base64: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const base64Data = base64.includes('base64,')
        ? base64.split('base64,')[1]
        : base64

      const byteString = atob(base64Data)
      const arrayBuffer = new ArrayBuffer(byteString.length)
      const uint8Array = new Uint8Array(arrayBuffer)

      for (let i = 0; i < byteString.length; i++)
        uint8Array[i] = byteString.charCodeAt(i)

      let mimeType = 'image/png'
      if (base64.includes('data:')) {
        const matches = base64.match(/data:([^;]+);/)
        if (matches?.[1])
          mimeType = matches[1]
      }

      resolve(new Blob([uint8Array], { type: mimeType }))
    }
    catch (error) {
      reject(error)
    }
  })
}

/**
 * 将 Blob 转换为 Base64 Data URL
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onloadend = () => {
      if (reader.result)
        resolve(reader.result as string)
      else
        reject(new Error('转换 Blob 到 Base64 失败'))
    }

    reader.onerror = () => {
      reject(new Error('读取 Blob 失败'))
    }

    reader.readAsDataURL(blob)
  })
}

/**
 * 将 ImageBitmap 转换为 Blob
 */
export function bitmapToBlob(imageBitmap: ImageBitmap, quality = 0.85): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height

  const ctx = canvas.getContext('2d')
  if (!ctx)
    throw new Error('无法创建 Canvas 上下文')

  ctx.drawImage(imageBitmap, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob)
          resolve(blob)
        else
          reject(new Error('无法创建 Blob'))
      },
      'image/webp',
      quality,
    )
  })
}

/**
 * 将 ImageBitmap 转换为 Base64 Data URL
 */
export function bitmapToBase64(imageBitmap: ImageBitmap, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = imageBitmap.width
    canvas.height = imageBitmap.height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('无法创建 Canvas 上下文'))
      return
    }

    ctx.drawImage(imageBitmap, 0, 0)
    resolve(canvas.toDataURL('image/webp', quality))
  })
}
