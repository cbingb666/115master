export interface ResizeResult {
  width: number
  height: number
}

/**
 * 计算图片在限定矩形内的等比缩放尺寸
 */
export function resize(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
): ResizeResult {
  if (originalWidth > originalHeight) {
    if (originalWidth <= maxWidth)
      return { width: originalWidth, height: originalHeight }

    const height = Math.round(originalHeight * (maxWidth / originalWidth))
    return { width: maxWidth, height }
  }

  if (originalHeight <= maxHeight)
    return { width: originalWidth, height: originalHeight }

  const width = Math.round(originalWidth * (maxHeight / originalHeight))
  return { width, height: maxHeight }
}
