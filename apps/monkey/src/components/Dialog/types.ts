import type { ModalProps } from './types.dialog'

// Hook 相关类型
export interface UseDialogOptions extends Omit<ModalProps, 'id' | 'visible'> {
}

// Prompt 特定选项
export interface UseDialogPromptOptions extends UseDialogOptions {
  /** 输入框默认值 */
  defaultValue?: string
  /** 输入框占位符 */
  placeholder?: string
  /** 输入框类型 */
  inputType?: 'text' | 'password' | 'email' | 'number'
  /** 是否必填 */
  required?: boolean
  /** 最大长度 */
  maxLength?: number
}

export interface UseDialogInstance {
  /** 对话框 ID */
  id: string
  /** 显示对话框 */
  show: () => void
  /** 隐藏对话框 */
  hide: () => void
  /** 销毁对话框 */
  destroy: () => void
}

export interface UseDialogHookReturn {
  /** 创建警告对话框 */
  alert: (options: UseDialogOptions) => Promise<boolean>
  /** 创建确认对话框 */
  confirm: (options: UseDialogOptions) => Promise<boolean>
  /** 创建提示输入对话框 */
  prompt: (options: UseDialogPromptOptions) => Promise<string | null>
  /** 创建自定义对话框 */
  create: (options: UseDialogOptions) => UseDialogInstance
  /** 关闭所有对话框 */
  closeAll: () => void
}
