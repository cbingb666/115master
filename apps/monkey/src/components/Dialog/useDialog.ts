import type { UseDialogHookReturn, UseDialogInstance, UseDialogOptions, UseDialogPromptOptions } from './types'
import type { DialogContainerContext, ModalProps, ModalPropsInternal } from './types.dialog'
import { h, ref } from 'vue'
import { router } from '@/app/router'
import PromptContent from './PromptContent'
import { useDialogContainer } from './provide'

let dialogId = 0

const generateId = () => `dialog-${++dialogId}-${Date.now()}`

const dialogInstances = new Map<string, {
  resolve: (value: any) => void
  reject: (reason?: any) => void
  instance: UseDialogInstance
}>()

function createDialogInstance(container: DialogContainerContext, id: string, options: UseDialogOptions): UseDialogInstance {
  let historyDispose: (() => void) | undefined

  if (options.history) {
    const initial = (history.state?.position as number) ?? 0
    let disposed = false

    router.push({ query: { ...router.currentRoute.value.query, _dlg: id } })

    const remove = router.afterEach((_to, _from, failure) => {
      if (disposed || failure)
        return
      const pos = (history.state?.position as number) ?? 0
      if (pos <= initial) {
        disposed = true
        remove()
        if (container) {
          container.updateDialog(id, { visible: false })
          setTimeout(() => container.removeDialog(id), 300)
        }
        options.cancelCallback?.()
      }
    })

    historyDispose = () => {
      if (disposed)
        return
      disposed = true
      remove()
      const pos = (history.state?.position as number) ?? 0
      const distance = pos - initial
      if (distance > 0)
        router.go(-distance)
    }
  }

  return {
    id,
    show: () => {
      if (container) {
        const dialogProps: ModalPropsInternal = {
          id,
          visible: false,
          ...options,
          _historyDispose: historyDispose,
        }
        container.addDialog(dialogProps)
        setTimeout(() => {
          if (container)
            container.updateDialog(id, { visible: true })
        }, 0)
      }
    },
    hide: () => {
      historyDispose?.()
      if (container) {
        container.updateDialog(id, { visible: false })
        setTimeout(() => {
          if (container)
            container.removeDialog(id)
        }, 300)
      }
    },
    destroy: () => {
      historyDispose?.()
      if (container)
        container.removeDialog(id)
      dialogInstances.delete(id)
    },
  }
}

function showPromptDialog(container: DialogContainerContext, options: UseDialogPromptOptions): Promise<string | null> {
  return new Promise((resolve, reject) => {
    if (!container) {
      reject(new Error('Dialog container not found. Please ensure DialogContainer is mounted.'))
      return
    }

    const id = generateId()
    const inputValue = ref(options.defaultValue || '')
    const promptContentRef = ref()

    const confirmHandler = () => {
      // 如果是必填且为空，不允许确认
      if (options.required && !inputValue.value.trim()) {
        return
      }
      const item = dialogInstances.get(id)
      if (item) {
        item.resolve(inputValue.value)
        dialogInstances.delete(id)
        container.updateDialog(id, { visible: false })
        setTimeout(() => {
          container.removeDialog(id)
        }, 300)
      }
    }

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

    dialogInstances.set(id, {
      resolve,
      reject,
      instance: createDialogInstance(container, id, options),
    })

    container.addDialog(dialogProps)

    // 在下一个渲染周期中显示对话框，触发淡入动画
    setTimeout(() => {
      if (container) {
        container.updateDialog(id, { visible: true })
      }
    }, 0)
  })
}

function showDialog(container: DialogContainerContext, options: UseDialogOptions): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (!container) {
      reject(new Error('Dialog container not found. Please ensure DialogContainer is mounted.'))
      return
    }

    const id = generateId()
    const instance = createDialogInstance(container, id, { ...options })

    dialogInstances.set(id, { resolve, reject, instance })

    const dialogProps: ModalProps = {
      id,
      visible: false,
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

    container.addDialog(dialogProps)

    // 在下一个渲染周期中显示对话框，触发淡入动画
    setTimeout(() => {
      if (container) {
        container.updateDialog(id, { visible: true })
      }
    }, 0)
  })
}

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
