import type { InjectionKey, ShallowRef } from 'vue'

export const overlayHostKey: InjectionKey<ShallowRef<HTMLDivElement | undefined>>
  = Symbol('ui-overlay-host')
