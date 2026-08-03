import type { InjectionKey, SlotsType, VNodeChild } from 'vue'
import {
  defineComponent,
  inject,
  nextTick,
  provide,
  shallowReactive,
} from 'vue'

interface ModalEntry {
  id: symbol
  element: HTMLDialogElement
  previous?: HTMLElement
  focus: () => void
}

interface ModalContext {
  activate: (entry: ModalEntry) => void
  settle: (id: symbol) => boolean
  top: (id: symbol) => boolean
}

const key: InjectionKey<ModalContext> = Symbol('uiModalHost')

function available(element: HTMLElement | undefined): element is HTMLElement {
  return !!element
    && element.isConnected
    && !element.matches(':disabled')
    && !element.closest('[inert]')
}

export function useModalHost(name: string) {
  const context = inject(key, null)

  if (!context)
    throw new Error(`${name} requires an ancestor ModalHost.`)
  return context
}

/** Coordinates the native top-layer surfaces owned by one Vue application. */
export const ModalHost = defineComponent({
  name: 'ModalHost',

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(_, { slots }) {
    if (inject(key, null))
      throw new Error('ModalHost cannot be nested inside another ModalHost.')

    const entries = shallowReactive<ModalEntry[]>([])

    function activate(entry: ModalEntry) {
      const active = entries.find(item => item.id === entry.id)

      if (active) {
        active.element = entry.element
        active.focus = entry.focus
        return
      }
      entries.push(entry)
    }

    function settle(id: symbol) {
      const index = entries.findIndex(entry => entry.id === id)

      if (index === -1)
        return false

      const entry = entries[index]
      const wasTop = index === entries.length - 1
      const child = entries[index + 1]

      if (child?.previous && entry.element.contains(child.previous))
        child.previous = entry.previous

      entries.splice(index, 1)

      if (!wasTop)
        return true

      const parent = entries[entries.length - 1]
      const expected = parent?.id

      void nextTick(() => {
        if (entries[entries.length - 1]?.id !== expected)
          return
        if (parent) {
          if (available(entry.previous) && parent.element.contains(entry.previous)) {
            entry.previous.focus({ preventScroll: true })
            return
          }
          parent.focus()
          return
        }
        if (available(entry.previous))
          entry.previous.focus({ preventScroll: true })
      })
      return true
    }

    provide(key, {
      activate,
      settle,
      top: id => entries[entries.length - 1]?.id === id,
    })

    return () => slots.default?.()
  },
})
