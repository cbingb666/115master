import type { ToastContainerContext, ToastProps, UseToastHookReturn, UseToastInstance, UseToastOptions } from './types'
import { useToastContainer } from './provide'

/** 全局状态 */
let toastId = 0

/** 生成唯一 ID */
const generateId = () => `toast-${++toastId}-${Date.now()}`

/** Toast 实例 Map */
const toastInstances = new Map<string, UseToastInstance>()

/** 创建 Toast 实例 */
function createToastInstance(
  container: ToastContainerContext,
  id: string,
  options: UseToastOptions,
): UseToastInstance {
  const instance: UseToastInstance = {
    id,
    show: () => {
      if (container) {
        const toastProps: ToastProps = {
          id,
          visible: true,
          ...options,
        }
        container.addToast(toastProps)
      }
    },
    hide: () => {
      if (container) {
        container.updateToast(id, { visible: false })
        setTimeout(() => {
          container.removeToast(id)
          toastInstances.delete(id)
        }, 300)
      }
    },
    destroy: () => {
      if (container) {
        container.removeToast(id)
      }
      toastInstances.delete(id)
    },
  }

  toastInstances.set(id, instance)
  return instance
}

/** 显示 Toast */
function showToast(container: ToastContainerContext, options: UseToastOptions): UseToastInstance {
  if (!container) {
    throw new Error('Toast container not found. Please ensure ToastContainer is mounted.')
  }

  const id = generateId()
  const instance = createToastInstance(container, id, options)

  /** 创建Toast配置 */
  const toastProps: ToastProps = {
    id,
    visible: true,
    ...options,
    closeCallback: () => {
      options.closeCallback?.()
      instance.destroy()
    },
  }

  // 添加到容器
  container.addToast(toastProps)

  return instance
}

/** 处理消息参数 */
function normalizeMessage(message: string | UseToastOptions, options: UseToastOptions = {}): UseToastOptions {
  if (typeof message === 'string') {
    return { ...options, content: message }
  }
  return { ...options, ...message }
}

/** 主要的 hook 函数 */
export function useToast(): UseToastHookReturn {
  const container = useToastContainer()
  if (!container) {
    throw new Error('Toast container not found. Please ensure ToastContainer is mounted.')
  }
  return {
    success: (message: string | UseToastOptions, options: UseToastOptions = {}) => {
      const normalizedOptions = normalizeMessage(message, { ...options, type: 'success' })
      return showToast(container, normalizedOptions)
    },

    error: (message: string | UseToastOptions, options: UseToastOptions = {}) => {
      const normalizedOptions = normalizeMessage(message, { ...options, type: 'error' })
      return showToast(container, normalizedOptions)
    },

    warning: (message: string | UseToastOptions, options: UseToastOptions = {}) => {
      const normalizedOptions = normalizeMessage(message, { ...options, type: 'warning' })
      return showToast(container, normalizedOptions)
    },

    info: (message: string | UseToastOptions, options: UseToastOptions = {}) => {
      const normalizedOptions = normalizeMessage(message, { ...options, type: 'info' })
      return showToast(container, normalizedOptions)
    },

    create: (options: UseToastOptions) => {
      return showToast(container, options)
    },

    clear: () => {
      container.clearToasts()
      toastInstances.clear()
    },
  }
}

export default useToast
