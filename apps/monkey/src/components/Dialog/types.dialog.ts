import type { Component, VNode } from 'vue'

// ============= Modal Types =============

/** 尺寸档位：md 默认（沿用 modal-box 的 max-w-lg）；lg/xl/full 见 SIZE_CLASS */
export type DialogSize = 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  /** 对话框唯一标识 */
  id: string
  /** 标题 */
  title?: string | (() => VNode) | VNode
  /** 内容 */
  content?: string | Component | (() => VNode) | VNode
  /** 确认按钮文本 */
  confirmText?: string | (() => VNode) | VNode
  /** 取消按钮文本 */
  cancelText?: string | (() => VNode) | VNode
  /** 是否显示确认按钮 */
  showConfirm?: boolean
  /** 是否显示取消按钮 */
  showCancel?: boolean
  /** 是否显示 */
  visible?: boolean
  /** 是否可以通过点击蒙层关闭 */
  maskClosable?: boolean
  /** 尺寸档位，默认 'md'；可用 className 覆盖 */
  size?: DialogSize
  /** BOX 的 CSS 类名 */
  className?: string
  /** Modal 的 CSS 类名 */
  classNameRoot?: string
  /** 标题的 CSS 类名 */
  classNameTitle?: string
  /** 内容的 CSS 类名 */
  classNameContent?: string
  /** 操作按钮的 CSS 类名 */
  classNameActions?: string
  /** 确认按钮点击回调, 返回 false 阻止关闭 */
  confirmCallback?: () => void | false | Promise<void | false>
  /** 取消按钮点击回调 */
  cancelCallback?: () => void
  /** 对话框打开完成回调 */
  openedCallback?: () => void
  /** 启用浏览器历史管理，后退可关闭对话框（alert/confirm/prompt 不适用） */
  history?: boolean
  /** 标题栏右侧操作（如关闭按钮），渲染在 actions 之前 */
  titleActions?: () => VNode
}

/** 内部使用的完整 Modal 属性，包含运行时注入字段 */
export interface ModalPropsInternal extends ModalProps {
  _historyDispose?: () => void
}

export interface ModalEmits {
  /** 确认事件 */
  confirm: []
  /** 取消事件 */
  cancel: []
  /** 关闭事件 */
  close: []
  /** 对话框打开完成事件 */
  opened: []
}

export interface ModalSlots {
  /** 内容 */
  default?: () => void
  /** 标题 */
  title?: () => void
  /** 操作按钮 */
  actions?: () => void
}

// ============= Container Types =============

export interface DialogContainerSlots {
  default?: () => void
}

export interface DialogContainerExpose {
  addDialog: (dialog: ModalProps) => void
  removeDialog: (id: string) => void
  clearDialogs: () => void
  updateDialog: (id: string, updates: Partial<ModalProps>) => void
}

export interface DialogContainerContext extends DialogContainerExpose {}
