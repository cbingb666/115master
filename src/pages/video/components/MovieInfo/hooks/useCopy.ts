import { ref } from 'vue'

/**
 * 提供复制文本到剪贴板的功能
 * @param duration 复制成功后状态保持的时间（毫秒）
 * @returns 复制相关的状态和方法
 */
export function useCopy(duration = 300) {
  const isCopied = ref(false)

  /**
   * 复制文本到剪贴板
   * @param text 要复制的文本
   * @returns Promise，复制成功时resolve，失败时reject
   */
  const copyText = async (text: string): Promise<void> => {
    if (!text)
      return

    try {
      await navigator.clipboard.writeText(text)
      isCopied.value = true
      setTimeout(() => {
        isCopied.value = false
      }, duration)
    }
    catch (err) {
      console.error('复制失败:', err)
      throw err
    }
  }

  return {
    isCopied,
    copyText,
  }
}
