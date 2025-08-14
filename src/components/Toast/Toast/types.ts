import type { Component, VNode } from 'vue'

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
