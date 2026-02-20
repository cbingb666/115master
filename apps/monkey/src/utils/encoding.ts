import jschardet from 'jschardet'
import { appLogger } from '@/utils/logger'

const utf8StrictDecoder = new TextDecoder('utf-8', { fatal: true })
const latin1Decoder = new TextDecoder('latin1')
const utf8LooseDecoder = new TextDecoder('utf-8', { fatal: false })
const UTF8_TEXT_PLAIN = 'text/plain;charset=utf-8'

/**
 * 将文件转换为 UTF-8 编码的 Blob 对象
 * @param {ArrayBuffer} arrayBuffer 文件arraybuffer
 */
export function convertToUtf8Blob(arrayBuffer: ArrayBuffer): Blob {
  const bytes = new Uint8Array(arrayBuffer).subarray(0, 32768)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return new Blob([arrayBuffer], { type: UTF8_TEXT_PLAIN })
  }

  try {
    utf8StrictDecoder.decode(arrayBuffer)
    return new Blob([arrayBuffer], { type: UTF8_TEXT_PLAIN })
  }
  catch {
    // 严格解码失败是预期路径，继续进行编码检测
  }

  const binaryString = latin1Decoder.decode(bytes)
  const result = jschardet.detect(binaryString)
  if (result?.encoding && result?.confidence > 0.3) {
    const encoding = result.encoding.toLowerCase()
    if (encoding !== 'utf-8' && encoding !== 'ascii') {
      try {
        const text = new TextDecoder(encoding, { fatal: true }).decode(arrayBuffer)
        return new Blob([text], { type: UTF8_TEXT_PLAIN })
      }
      catch {
        appLogger.warn(`检测编码 ${encoding} 解析失败，尝试最后兜底`)
      }
    }
  }

  const fallbackText = utf8LooseDecoder.decode(arrayBuffer)
  return new Blob([fallbackText], { type: UTF8_TEXT_PLAIN })
}
