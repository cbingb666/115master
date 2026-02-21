import type { ToastContainerContext } from './types'
import { inject, provide } from 'vue'

export const TOAST_CONTAINER_KEY = Symbol('toastContainer')

/** 全局回退：DialogModal 等不在 ToastContainer 子树中的组件也能访问 */
let globalContainer: ToastContainerContext | undefined

export function useToastContainerProvide(provideValues: ToastContainerContext) {
  provide(TOAST_CONTAINER_KEY, provideValues)
  globalContainer = provideValues
}

export function useToastContainer(): ToastContainerContext | undefined {
  return inject<ToastContainerContext | null>(TOAST_CONTAINER_KEY, null) ?? globalContainer
}
