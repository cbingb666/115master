import type { ToastProps } from '@/components/Toast/Toast/types'

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
