import { jaccardSimilarity } from './array'

/**
 * 计算文件名的 Jaccard 相似度
 * @param filename 文件名
 * @param subtitle 字幕名
 * @returns 相似度
 */
export function filenameJaccardSimilarity(filename: string, subtitle: string) {
  return jaccardSimilarity(filename.split(''), subtitle.split(''))
}
