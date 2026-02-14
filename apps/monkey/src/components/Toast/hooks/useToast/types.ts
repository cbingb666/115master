import type { ToastProps } from '@/components/Toast/Toast/types'

// Hook 相关类型
export interface UseToastOptions extends Omit<ToastProps, 'id' | 'visible'> {
}

export interface UseToastInstance {
  /** Toast ID */
  id: string
  /** 显示 Toast */
  show: () => void
  /** 隐藏 Toast */
  hide: () => void
  /** 销毁 Toast */
  destroy: () => void
}

export interface UseToastHookReturn {
  /** 显示成功消息 */
  success: (message: string | UseToastOptions, options?: UseToastOptions) => UseToastInstance
  /** 显示错误消息 */
  error: (message: string | UseToastOptions, options?: UseToastOptions) => UseToastInstance
  /** 显示警告消息 */
  warning: (message: string | UseToastOptions, options?: UseToastOptions) => UseToastInstance
  /** 显示信息消息 */
  info: (message: string | UseToastOptions, options?: UseToastOptions) => UseToastInstance
  /** 创建自定义 Toast */
  create: (options: UseToastOptions) => UseToastInstance
  /** 清除所有 Toast */
  clear: () => void
}
