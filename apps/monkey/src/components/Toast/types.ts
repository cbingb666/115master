import type { Component, VNode } from 'vue'

// ==================== Toast 类型 ====================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  /** Toast 唯一标识 */
  id: string
  /** 标题 */
  title?: string
  /** 内容 */
  content?: string | Component | (() => VNode) | VNode
  /** Toast 类型 */
  type?: ToastType
  /** 自动关闭时间(毫秒)，0表示不自动关闭 */
  duration?: number
  /** 是否可以手动关闭 */
  closable?: boolean
  /** 是否显示 */
  visible?: boolean
  /** Toast 的 CSS 类名 */
  className?: string
  /** 关闭回调 */
  closeCallback?: () => void
}

export interface ToastEmits {
  /** 关闭事件 */
  close: [id: string]
}

export interface ToastSlots {
  /** 内容 */
  default?: () => void
  /** 标题 */
  title?: () => void
  /** 图标 */
  icon?: () => void
}

// ==================== ToastContainer 类型 ====================

export interface ToastContainerProps {
  /** 位置 */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  /** 最大显示数量 */
  maxCount?: number
  /** 容器的 CSS 类名 */
  className?: string
}

export interface ToastContainerSlots {
  default?: () => void
}

export interface ToastContainerExpose {
  addToast: (toast: ToastProps) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  updateToast: (id: string, updates: Partial<ToastProps>) => void
}

export interface ToastContainerContext extends ToastContainerExpose {}

// ==================== useToast Hook 类型 ====================

export interface UseToastOptions extends Omit<ToastProps, 'id' | 'visible'> {}

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
