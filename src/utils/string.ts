import emojiRegex from 'emoji-regex'
import { jaccardSimilarity } from '@/utils/array'

/**
 * 计算文件名的 Jaccard 相似度
 * @param filename 文件名
 * @param subtitle 字幕名
 * @returns 相似度
 */
export function filenameJaccardSimilarity(filename: string, subtitle: string) {
  return jaccardSimilarity(filename.split(''), subtitle.split(''))
}

/**
 * 提取文本中的 Emoji
 * @param text 文本
 * @returns Emoji 列表
 */
export function extractEmojis(text: string): string[] {
  const regex = emojiRegex()
  return text.match(regex) ?? []
}
