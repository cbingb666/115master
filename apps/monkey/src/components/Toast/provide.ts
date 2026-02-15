import type { ToastContainerContext } from './types'
import { inject, provide } from 'vue'

export const TOAST_CONTAINER_KEY = Symbol('toastContainer')

export function useToastContainerProvide(provideValues: ToastContainerContext) {
  provide(TOAST_CONTAINER_KEY, provideValues)
}

export function useToastContainer(): ToastContainerContext | undefined {
  return inject(TOAST_CONTAINER_KEY)
}
