/**
 * 生成间隔数组
 * @param start 开始
 * @param end 结束
 * @param interval 间隔
 * @returns 间隔数组
 * @example
 * intervalArray(0, 10, 1) // [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
 * intervalArray(0, 10, 2) // [0, 2, 4, 6, 8]
 * intervalArray(0, 10, 3) // [0, 3, 6, 9]
 */
export function intervalArray(start: number, end: number, interval: number): number[] {
  const diff = end - start
  const array = []
  for (let i = 0; i < diff; i += interval) {
    array.push(i)
  }
  return array
}

/**
 * 计算两个数组的 Jaccard 相似度
 * @param arr1 数组1
 * @param arr2 数组2
 * @returns 相似度
 */
export function jaccardSimilarity(arr1: string[], arr2: string[]) {
  const set1 = new Set(arr1)
  const set2 = new Set(arr2)

  let intersectionSize = 0
  for (const item of set1) {
    if (set2.has(item)) {
      intersectionSize++
    }
  }

  const unionSize = set1.size + set2.size - intersectionSize

  if (unionSize === 0) {
    return 0 // Or handle as an error, depending on requirements
  }

  return intersectionSize / unionSize
}
