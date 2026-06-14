// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isBlackFrame } from './blackFrame.ts'
import { compress } from './compress.ts'
import { base64ToBlob, bitmapToBase64, bitmapToBlob, blobToBase64 } from './convert.ts'
import { resize } from './resize.ts'
import { isPortrait, size } from './size.ts'

function createMockContext() {
  return {
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    createImageData: vi.fn((width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
    })),
    putImageData: vi.fn(),
  }
}

function createMockCanvas(ctx?: ReturnType<typeof createMockContext>) {
  const canvas = document.createElement('canvas')
  const context = ctx ?? createMockContext()
  vi.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D)
  return { canvas, context }
}

function mockImage() {
  const img = {
    width: 0,
    height: 0,
    src: '',
    crossOrigin: '',
    onload: null as ((event: Event) => void) | null,
    onerror: null as ((event: Event) => void) | null,
  }
  vi.spyOn(globalThis, 'Image').mockImplementation(() => img as unknown as HTMLImageElement)
  return img
}

describe('resize', () => {
  it('returns original size when it fits within bounds', () => {
    expect(resize(100, 50, 200, 200)).toEqual({ width: 100, height: 50 })
  })

  it('scales landscape images to max width', () => {
    expect(resize(2000, 1000, 1000, 800)).toEqual({ width: 1000, height: 500 })
  })

  it('scales portrait images to max height', () => {
    expect(resize(1000, 2000, 800, 1000)).toEqual({ width: 500, height: 1000 })
  })

  it('keeps exact dimensions when equal to bounds', () => {
    expect(resize(100, 100, 100, 100)).toEqual({ width: 100, height: 100 })
  })
})

describe('compress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  function setupCompress(ctx?: ReturnType<typeof createMockContext>) {
    const { canvas, context } = createMockCanvas(ctx)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      callback?.(new Blob(['compressed'], { type: 'image/webp' }))
    })

    const originalCreateObjectURL = URL.createObjectURL
    const originalRevokeObjectURL = URL.revokeObjectURL
    URL.createObjectURL = vi.fn(() => 'blob://fake')
    URL.revokeObjectURL = vi.fn()

    const img = { width: 400, height: 300, onload: null as unknown, onerror: null as unknown, src: '' }
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      setTimeout(() => (img.onload as (event: Event) => void)?.(new Event('load')), 0)
      return img as unknown as HTMLImageElement
    })

    return { canvas, context, img, originalCreateObjectURL, originalRevokeObjectURL }
  }

  it('compresses a blob using canvas', async () => {
    const { originalCreateObjectURL, originalRevokeObjectURL } = setupCompress()

    const blob = new Blob(['image'], { type: 'image/jpeg' })
    const result = await compress(blob, { maxWidth: 200, maxHeight: 200, type: 'image/webp' })

    expect(result).toBeInstanceOf(Blob)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob://fake')

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })

  it('rejects when canvas context is unavailable', async () => {
    const { canvas } = setupCompress()
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)

    const blob = new Blob(['image'], { type: 'image/jpeg' })
    await expect(compress(blob)).rejects.toThrow('无法获取 Canvas 上下文')
  })

  it('rejects when image fails to load', async () => {
    const { img } = setupCompress()
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      setTimeout(() => (img.onerror as (event: Event) => void)?.(new Event('error')), 0)
      return img as unknown as HTMLImageElement
    })

    const blob = new Blob(['image'], { type: 'image/jpeg' })
    await expect(compress(blob)).rejects.toThrow('图片加载失败')
  })

  it('rejects when canvas toBlob returns null', async () => {
    const { canvas, originalCreateObjectURL, originalRevokeObjectURL } = setupCompress()
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      callback?.(null)
    })

    const blob = new Blob(['image'], { type: 'image/jpeg' })
    await expect(compress(blob)).rejects.toThrow('图片压缩失败')

    URL.createObjectURL = originalCreateObjectURL
    URL.revokeObjectURL = originalRevokeObjectURL
  })
})

describe('convert', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('base64ToBlob decodes a plain base64 string', async () => {
    const blob = await base64ToBlob(btoa('hello'))
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBe(5)
  })

  it('base64ToBlob respects the data URL mime type', async () => {
    const blob = await base64ToBlob('data:image/webp;base64,abcd')
    expect(blob.type).toBe('image/webp')
  })

  it('base64ToBlob rejects on invalid input', async () => {
    await expect(base64ToBlob('!@#$%')).rejects.toThrow()
  })

  it('blobToBase64 reads a blob as data URL', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    const base64 = await blobToBase64(blob)
    expect(base64.startsWith('data:')).toBe(true)
  })

  it('blobToBase64 rejects when reader result is empty', async () => {
    const reader = { result: null, onloadend: null as unknown, onerror: null as unknown, readAsDataURL: vi.fn() }
    vi.spyOn(globalThis, 'FileReader').mockImplementation(() => {
      setTimeout(() => (reader.onloadend as () => void)?.(), 0)
      return reader as unknown as FileReader
    })

    await expect(blobToBase64(new Blob(['x']))).rejects.toThrow('转换 Blob 到 Base64 失败')
  })

  it('blobToBase64 rejects on reader error', async () => {
    const reader = { result: null, onloadend: null as unknown, onerror: null as unknown, readAsDataURL: vi.fn() }
    vi.spyOn(globalThis, 'FileReader').mockImplementation(() => {
      setTimeout(() => (reader.onerror as () => void)?.(), 0)
      return reader as unknown as FileReader
    })

    await expect(blobToBase64(new Blob(['x']))).rejects.toThrow('读取 Blob 失败')
  })

  it('bitmapToBlob converts an ImageBitmap', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      callback?.(new Blob(['webp'], { type: 'image/webp' }))
    })

    const bitmap = { width: 10, height: 10 } as ImageBitmap
    const result = await bitmapToBlob(bitmap)
    expect(result.type).toBe('image/webp')
  })

  it('bitmapToBlob rejects when toBlob returns null', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    vi.spyOn(canvas, 'toBlob').mockImplementation((callback) => {
      callback?.(null)
    })

    const bitmap = { width: 10, height: 10 } as ImageBitmap
    await expect(bitmapToBlob(bitmap)).rejects.toThrow('无法创建 Blob')
  })

  it('bitmapToBlob throws when canvas context is unavailable', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)

    const bitmap = { width: 10, height: 10 } as ImageBitmap
    await expect(async () => bitmapToBlob(bitmap)).rejects.toThrow('无法创建 Canvas 上下文')
  })

  it('bitmapToBase64 converts an ImageBitmap', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)
    vi.spyOn(canvas, 'toDataURL').mockReturnValue('data:image/webp;base64,fake')

    const bitmap = { width: 10, height: 10 } as ImageBitmap
    const result = await bitmapToBase64(bitmap)
    expect(result).toBe('data:image/webp;base64,fake')
  })

  it('bitmapToBase64 rejects when canvas context is unavailable', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)

    const bitmap = { width: 10, height: 10 } as ImageBitmap
    await expect(bitmapToBase64(bitmap)).rejects.toThrow('无法创建 Canvas 上下文')
  })
})

describe('size', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with image dimensions', async () => {
    const img = { width: 640, height: 480, onload: null as unknown, onerror: null as unknown, src: '' }
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      setTimeout(() => (img.onload as (event: Event) => void)?.(new Event('load')), 0)
      return img as unknown as HTMLImageElement
    })

    const result = await size('https://example.com/a.jpg')
    expect(result).toEqual({ width: 640, height: 480 })
  })

  it('rejects when image fails to load', async () => {
    const img = { width: 0, height: 0, onload: null as unknown, onerror: null as unknown, src: '' }
    vi.spyOn(globalThis, 'Image').mockImplementation(() => {
      setTimeout(() => (img.onerror as (event: Event) => void)?.(new Event('error')), 0)
      return img as unknown as HTMLImageElement
    })

    await expect(size('https://example.com/broken.jpg')).rejects.toThrow('图片加载失败')
  })
})

describe('isPortrait', () => {
  it('returns true when width is less than height', () => {
    expect(isPortrait(100, 200)).toBe(true)
  })

  it('returns false when width is greater than height', () => {
    expect(isPortrait(200, 100)).toBe(false)
  })
})

describe('isBlackFrame', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.ImageBitmap = class ImageBitmap {} as unknown as typeof ImageBitmap
  })

  function createBitmap(width: number, height: number): ImageBitmap {
    const Bitmap = globalThis.ImageBitmap as unknown as new () => ImageBitmap
    const bitmap = new Bitmap()
    Object.defineProperty(bitmap, 'width', { value: width })
    Object.defineProperty(bitmap, 'height', { value: height })
    return bitmap
  }

  function createCanvasWithBrightness(brightness: number) {
    const { canvas, context } = createMockCanvas()
    canvas.width = 10
    canvas.height = 10

    const imageData = { data: new Uint8ClampedArray(10 * 10 * 4).fill(brightness) } as ImageData
    context.getImageData.mockReturnValue(imageData)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)

    return { canvas, context }
  }

  it('detects a fully black ImageBitmap', async () => {
    createCanvasWithBrightness(0)
    const result = await isBlackFrame(createBitmap(10, 10))
    expect(result).toBe(true)
  })

  it('detects a bright ImageBitmap as not black', async () => {
    createCanvasWithBrightness(255)
    const result = await isBlackFrame(createBitmap(10, 10))
    expect(result).toBe(false)
  })

  it('detects a black frame from an image URL', async () => {
    createCanvasWithBrightness(0)
    const img = mockImage()
    img.width = 10
    img.height = 10

    setTimeout(() => (img.onload as (event: Event) => void)?.(new Event('load')), 0)

    const result = await isBlackFrame('https://example.com/black.jpg')
    expect(result).toBe(true)
  })

  it('rejects when image URL fails to load', async () => {
    createCanvasWithBrightness(0)
    const img = mockImage()

    setTimeout(() => (img.onerror as (event: Event) => void)?.(new Event('error')), 0)

    await expect(isBlackFrame('https://example.com/broken.jpg')).rejects.toThrow('图片加载失败')
  })

  it('rejects when string source canvas context is unavailable', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)

    await expect(isBlackFrame('https://example.com/black.jpg')).rejects.toThrow('无法创建 Canvas 上下文')
  })

  it('rejects when analysis throws inside image onload', async () => {
    const { context } = createCanvasWithBrightness(0)
    const img = mockImage()
    img.width = 10
    img.height = 10

    context.getImageData.mockImplementation(() => {
      throw new Error('analysis failed')
    })

    setTimeout(() => (img.onload as (event: Event) => void)?.(new Event('load')), 0)

    await expect(isBlackFrame('https://example.com/black.jpg')).rejects.toThrow('analysis failed')
  })

  it('returns false when bitmap canvas context is unavailable', async () => {
    const { canvas } = createMockCanvas()
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)
    vi.spyOn(document, 'createElement').mockReturnValue(canvas)

    const result = await isBlackFrame(createBitmap(10, 10))
    expect(result).toBe(false)
  })
})
