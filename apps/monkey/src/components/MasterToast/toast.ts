import { reactive } from 'vue'

export type ToastKind = 'info' | 'success' | 'error' | 'loading'

export interface ToastItem {
  id: number
  kind: ToastKind
  message: string
}

export interface LoadingHandle {
  update: (msg: string) => void
  success: (msg?: string) => void
  error: (msg?: string) => void
  dismiss: () => void
}

const DURATION: Record<Exclude<ToastKind, 'loading'>, number> = {
  info: 3000,
  success: 3000,
  error: 6000,
}

export const toastQueue = reactive<ToastItem[]>([])

let seq = 0
function nextId() {
  return ++seq
}

function remove(id: number) {
  const i = toastQueue.findIndex(t => t.id === id)
  if (i >= 0)
    toastQueue.splice(i, 1)
}

function push(kind: Exclude<ToastKind, 'loading'>, message: string): void {
  const id = nextId()
  toastQueue.push({ id, kind, message })
  setTimeout(() => remove(id), DURATION[kind])
}

export const toast = {
  info: (msg: string) => push('info', msg),
  success: (msg: string) => push('success', msg),
  error: (msg: string) => push('error', msg),
  loading(message: string): LoadingHandle {
    const id = nextId()
    toastQueue.push({ id, kind: 'loading', message })
    const findIdx = () => toastQueue.findIndex(t => t.id === id)
    return {
      update(msg) {
        const i = findIdx()
        if (i >= 0)
          toastQueue[i].message = msg
      },
      success(msg) {
        const i = findIdx()
        if (i >= 0)
          toastQueue[i] = { id, kind: 'success', message: msg ?? message }
        setTimeout(() => remove(id), DURATION.success)
      },
      error(msg) {
        const i = findIdx()
        if (i >= 0)
          toastQueue[i] = { id, kind: 'error', message: msg ?? message }
        setTimeout(() => remove(id), DURATION.error)
      },
      dismiss() {
        remove(id)
      },
    }
  },
}
