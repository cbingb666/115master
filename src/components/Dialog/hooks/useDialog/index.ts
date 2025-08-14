import type { UseDialogHookReturn, UseDialogInstance, UseDialogOptions, UseDialogPromptOptions } from './types'
import type { DialogContainerContext } from '@/components/Dialog/Container/types'
import type { ModalProps } from '@/components/Dialog/Modal/types'
import { h, ref } from 'vue'
import { useDialogContainer } from '@/components/Dialog/Container/provide'
import PromptContent from './PromptContent'

/** 全局状态 */
let dialogId = 0

/** 生成唯一 ID */
const generateId = () => `dialog-${++dialogId}-${Date.now()}`

/** 对话框实例 Map */
const dialogInstances = new Map<string, {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  instance: UseDialogInstance
}>()

/** 创建对话框实例 */
function createDialogInstance(container: DialogContainerContext, id: string, options: UseDialogOptions): UseDialogInstance {
  return {
    id,
    show: () => {
      if (container) {
        const dialogProps: ModalProps = {
          id,
          visible: false, // 先设置为隐藏
          ...options,
        }
        container.addDialog(dialogProps)

        // 在下一个渲染周期中显示对话框，触发淡入动画
        setTimeout(() => {
          if (container) {
            container.updateDialog(id, { visible: true })
          }
        }, 0)
      }
    },
    hide: () => {
      if (container) {
        container.updateDialog(id, { visible: false })
        // 等待动画完成后移除
        setTimeout(() => {
          if (container) {
            container.removeDialog(id)
          }
        }, 300)
      }
    },
    destroy: () => {
      if (container) {
        container.removeDialog(id)
      }
      dialogInstances.delete(id)
    },
  }
}

/** 显示 Prompt 对话框 */
function showPromptDialog(container: DialogContainerContext, options: UseDialogPromptOptions): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!container) {
      reject(new Error('Dialog container not found. Please ensure DialogContainer is mounted.'))
      return
    }

    const id = generateId()
    /** 创建响应式的输入值引用 */
    const inputValue = ref(options.defaultValue || '')
    /** PromptContent 组件引用，用于调用聚焦方法 */
    const promptContentRef = ref()

    /** 确认回调函数 */
    const confirmHandler = () => {
      // 如果是必填且为空，不允许确认
      if (options.required && !inputValue.value.trim()) {
        return
      }
      const item = dialogInstances.get(id)
      if (item) {
        item.resolve(inputValue.value)
        dialogInstances.delete(id)
        // 关闭对话框
        container.updateDialog(id, { visible: false })
        setTimeout(() => {
          container.removeDialog(id)
        }, 300)
      }
    }

    /** 创建对话框配置 */
    const dialogProps: ModalProps = {
      id,
      visible: false,
      title: options.title || '请输入',
      content: () => h(PromptContent, {
        'ref': promptContentRef,
        options,
        'modelValue': inputValue.value,
        'onUpdate:modelValue': (value: string) => {
          inputValue.value = value
        },
        'onConfirm': confirmHandler,
      }),
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      maskClosable: options.maskClosable !== false,
      className: options.className,
      confirmCallback: confirmHandler,
      cancelCallback: () => {
        const item = dialogInstances.get(id)
        if (item) {
          item.resolve(null)
          dialogInstances.delete(id)
        }
      },
      openedCallback: () => {
        // 对话框打开动画完成后，聚焦到输入框
        if (promptContentRef.value?.focus) {
          promptContentRef.value.focus()
        }
      },
    }

    // 保存实例和回调
    dialogInstances.set(id, {
      resolve,
      reject,
      instance: createDialogInstance(container, id, options),
    })

    // 添加到容器
    container.addDialog(dialogProps)

    // 在下一个渲染周期中显示对话框，触发淡入动画
    setTimeout(() => {
      if (container) {
        container.updateDialog(id, { visible: true })
      }
    }, 0)
  })
}

/** 显示对话框 */
function showDialog(container: DialogContainerContext, options: UseDialogOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!container) {
      reject(new Error('Dialog container not found. Please ensure DialogContainer is mounted.'))
      return
    }

    const id = generateId()
    const instance = createDialogInstance(container, id, { ...options })

    // 保存实例和回调
    dialogInstances.set(id, { resolve, reject, instance })

    /** 创建对话框配置，先设置为隐藏状态 */
    const dialogProps: ModalProps = {
      id,
      visible: false, // 先设置为隐藏
      ...options,
      confirmCallback: () => {
        const item = dialogInstances.get(id)
        if (item) {
          item.resolve(true)
          dialogInstances.delete(id)
        }
      },
      cancelCallback: () => {
        const item = dialogInstances.get(id)
        if (item) {
          item.resolve(false)
          dialogInstances.delete(id)
        }
      },
    }

    // 添加到容器
    container.addDialog(dialogProps)

    // 在下一个渲染周期中显示对话框，触发淡入动画
    setTimeout(() => {
      if (container) {
        container.updateDialog(id, { visible: true })
      }
    }, 0)
  })
}

/** 主要的 hook 函数 */
export function useDialog(): UseDialogHookReturn {
  const container = useDialogContainer()
  if (!container) {
    throw new Error('Dialog container not found. Please ensure DialogContainer is mounted.')
  }

  return {
    alert: (options: UseDialogOptions) => {
      return showDialog(container, options)
    },

    confirm: (options: UseDialogOptions) => {
      return showDialog(container, options)
    },

    prompt: (options: UseDialogPromptOptions) => {
      return showPromptDialog(container, options)
    },

    create: (options: UseDialogOptions) => {
      const id = generateId()
      const instance = createDialogInstance(container, id, { ...options })
      instance.show()
      return instance
    },

    closeAll: () => {
      container.clearDialogs()
      dialogInstances.forEach(({ reject }) => {
        reject(new Error('All dialogs closed'))
      })
      dialogInstances.clear()
    },
  }
}

export default useDialog
