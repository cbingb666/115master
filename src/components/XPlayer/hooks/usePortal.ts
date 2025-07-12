import type { InjectionKey, Ref } from 'vue'
import { inject, provide, ref } from 'vue'

export interface PortalContext {
  container: Ref<HTMLElement | undefined>
}

export const PortalSymbol: InjectionKey<PortalContext>
  = Symbol('XPlayerPortal')

export function usePortalProvider() {
  const container = ref<HTMLElement>()

  const context: PortalContext = {
    container,
  }

  provide(PortalSymbol, context)
  return context
}

export function usePortal() {
  const context = inject(PortalSymbol)
  if (!context) {
    throw new Error('usePortal must be used within a XPlayer component')
  }
  return context
}
