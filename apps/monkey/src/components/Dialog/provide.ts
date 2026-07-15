import type { DialogContainerContext } from './types.dialog'
import { inject, provide } from 'vue'

export const DIALOG_CONTAINER_KEY = Symbol('dialogContainer')

/** 全局回退：供不在 DialogContainer 子树中的调用方（如模块顶层回调）访问，与 Toast 一致 */
let globalContainer: DialogContainerContext | undefined

export function useDialogContainerProvide(provideValues: DialogContainerContext) {
  provide(DIALOG_CONTAINER_KEY, provideValues)
  globalContainer = provideValues
}

export function useDialogContainer(): DialogContainerContext | undefined {
  return inject<DialogContainerContext | null>(DIALOG_CONTAINER_KEY, null) ?? globalContainer
}
