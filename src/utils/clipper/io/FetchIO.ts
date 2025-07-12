/**
 * FetchIO 类 - 负责从URL获取指定范围的视频数据
 * 处理数据块的读取和管理
 */
export class FetchIO {
  /**
   * 从URL获取指定范围的ArrayBuffer
   * @param url 目标URL
   * @param start 起始字节
   * @param end 结束字节
   * @returns 获取到的ArrayBuffer
   */
  async fetchBufferRange(
    url: string,
    start: number,
    end: number,
  ): Promise<Response> {
    const response = fetch(url, {
      method: 'GET',
      headers: {
        Range: `bytes=${start}-${end}`,
      },
      priority: 'low',
    })
    return response
  }

  /**
   * 流式读取视频块
   */
  async streamChunks(
    url: string,
    callback: (buffer: ArrayBuffer, position: number) => Promise<boolean>,
    options: {
      stepChunkSize?: number
      maxSteps?: number
    } = {},
  ): Promise<void> {
    /** 步进块大小 */
    const stepChunkSize = options.stepChunkSize || 188 * 1024 * 2
    let currentPosition = 0
    let shouldContinue = true

    // 读取初始块
    try {
      // 继续读取后续数据块，直到达到最大步数或回调返回false
      while (shouldContinue) {
        const response = await this.fetchBufferRange(
          url,
          currentPosition,
          currentPosition + stepChunkSize - 1,
        )
        if (response.status !== 206) {
          shouldContinue = false
          break
        }
        shouldContinue = await callback(
          await response.arrayBuffer(),
          currentPosition,
        )
        currentPosition += stepChunkSize
      }
    }
    catch (error) {
      console.error('流式读取数据出错:', error)
      throw error
    }
  }
}
