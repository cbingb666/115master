import type { DialogContainerContext } from './types'
import { inject, provide } from 'vue'

export const DIALOG_CONTAINER_KEY = Symbol('dialogContainer')

export function useDialogContainerProvide(provideValues: DialogContainerContext) {
  provide(DIALOG_CONTAINER_KEY, provideValues)
}

export function useDialogContainer(): DialogContainerContext | undefined {
  return inject(DIALOG_CONTAINER_KEY)
}
