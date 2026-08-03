import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import {
  computed,
  defineComponent,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { useModalHost } from './ModalHost'

export type ModalInitialFocus
  = | HTMLElement
    | string
    | (() => HTMLElement | null | undefined)
export type ModalDismissReason = 'escape' | 'backdrop'

type ModalKind = 'dialog' | 'drawer'
type ModalState = 'closed' | 'opening' | 'open' | 'closing'

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  kind: {
    type: String as PropType<ModalKind>,
    required: true,
  },
  closeOnEscape: {
    type: Boolean,
    default: true,
  },
  closeOnBackdrop: {
    type: Boolean,
    default: true,
  },
  initialFocus: {
    type: [String, Object, Function] as PropType<ModalInitialFocus>,
    default: undefined,
  },
} as const

export type ModalRootProps = ExtractPublicPropTypes<typeof props>

function milliseconds(value: string) {
  const number = Number.parseFloat(value)

  if (Number.isNaN(number))
    return 0
  return value.trim().endsWith('ms') ? number : number * 1000
}

function duration(element: HTMLElement) {
  const style = getComputedStyle(element)
  const durations = style.transitionDuration.split(',').map(milliseconds)
  const delays = style.transitionDelay.split(',').map(milliseconds)

  return Math.max(0, ...durations.map((value, index) => value + (delays[index % delays.length] ?? 0)))
}

/** Private lifecycle implementation shared by Dialog and Drawer. */
export const ModalRoot = defineComponent({
  name: 'ModalRoot',

  inheritAttrs: false,

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'close': (_reason: ModalDismissReason) => true,
    'keydown': (_event: KeyboardEvent) => true,
    'opened': () => true,
    'closed': () => true,
  },

  slots: Object as SlotsType<{
    default?: (options: { interactive: boolean }) => VNodeChild
  }>,

  setup(props, { attrs, emit, slots }) {
    const host = useModalHost(props.kind === 'dialog' ? 'Dialog' : 'Drawer')
    const element = shallowRef<HTMLDialogElement>()
    const state = shallowRef<ModalState>('closed')
    const id = Symbol(`ui-${props.kind}`)
    const top = computed(() => host.top(id))
    let timer: ReturnType<typeof setTimeout> | undefined
    let frame: number | undefined
    let listener: ((event: TransitionEvent) => void) | undefined
    let watched: HTMLDialogElement | undefined
    let requested = false
    let internal = 0
    let active = false
    let mounted = false
    let disposed = false

    function clear() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
        frame = undefined
      }
      if (watched && listener) {
        watched.removeEventListener('transitionend', listener)
        watched.removeEventListener('transitioncancel', listener)
      }
      watched = undefined
      listener = undefined
    }

    function wait(done: () => void) {
      const target = element.value

      if (!target) {
        done()
        return
      }

      const timeout = duration(target)

      if (timeout === 0) {
        done()
        return
      }

      const finish = () => {
        clear()
        done()
      }

      listener = (event) => {
        if (event.target !== target)
          return
        finish()
      }
      watched = target
      target.addEventListener('transitionend', listener)
      target.addEventListener('transitioncancel', listener)
      timer = setTimeout(finish, timeout)
    }

    function named() {
      const label = attrs['aria-label']
      const labelledby = attrs['aria-labelledby']

      return (typeof label === 'string' && !!label.trim())
        || (typeof labelledby === 'string' && !!labelledby.trim())
    }

    function target() {
      const root = element.value
      const value = typeof props.initialFocus === 'function'
        ? props.initialFocus()
        : props.initialFocus

      if (!root || !value)
        return undefined
      if (typeof value === 'string')
        return root.querySelector<HTMLElement>(value) ?? undefined
      if (value instanceof HTMLElement && root.contains(value))
        return value
      return undefined
    }

    function focus() {
      const root = element.value
      const destination = target()
        ?? root?.querySelector<HTMLElement>(
          '[autofocus], button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )
        ?? root

      destination?.focus({ preventScroll: true })
    }

    function settle() {
      if (!active)
        return false
      active = false
      return host.settle(id)
    }

    function completeOpen(target: HTMLDialogElement) {
      if (!props.open || state.value !== 'open' || element.value !== target || !target.open)
        return
      emit('opened')
    }

    function promote(target: HTMLDialogElement) {
      if (!props.open || element.value !== target || !target.open)
        return

      const open = () => {
        if (!props.open || element.value !== target || !target.open)
          return
        state.value = 'open'
        void nextTick(() => wait(() => completeOpen(target)))
      }

      if (duration(target) === 0) {
        open()
        return
      }

      frame = requestAnimationFrame(() => {
        frame = undefined
        open()
      })
    }

    function completeClose(target: HTMLDialogElement) {
      if (props.open || state.value !== 'closing' || element.value !== target)
        return

      if (target.open) {
        internal += 1
        target.close()
      }
      state.value = 'closed'
      settle()
      emit('closed')
    }

    function show() {
      clear()

      const target = element.value

      if (!target)
        return
      if (!named())
        throw new Error(`${props.kind === 'dialog' ? 'Dialog' : 'Drawer'} requires an accessible label.`)

      if (!active) {
        active = true
        host.activate({
          id,
          element: target,
          previous: document.activeElement instanceof HTMLElement
            ? document.activeElement
            : undefined,
          focus,
        })
      }
      state.value = 'opening'

      void nextTick(() => {
        if (disposed || !props.open || element.value !== target)
          return
        if (!target.open)
          target.showModal()
        focus()
        promote(target)
      })
    }

    function hide() {
      clear()

      const target = element.value

      if (!target?.open) {
        const wasActive = settle()
        state.value = 'closed'
        if (wasActive)
          emit('closed')
        return
      }
      state.value = 'closing'

      void nextTick(() => {
        if (props.open || state.value !== 'closing' || element.value !== target)
          return
        wait(() => completeClose(target))
      })
    }

    function request(reason: ModalDismissReason) {
      if (!top.value || requested || state.value === 'closing')
        return
      requested = true
      emit('close', reason)
      emit('update:open', false)
      void nextTick(() => {
        if (props.open)
          requested = false
      })
    }

    function cancel(event: Event) {
      event.preventDefault()

      if (props.closeOnEscape)
        request('escape')
    }

    function keydown(event: KeyboardEvent) {
      emit('keydown', event)

      if (event.key !== 'Escape')
        return
      event.preventDefault()
      event.stopPropagation()

      if (props.closeOnEscape)
        request('escape')
    }

    function backdrop(event: MouseEvent) {
      if (event.target !== event.currentTarget || !props.closeOnBackdrop)
        return
      request('backdrop')
    }

    function closed() {
      if (internal > 0) {
        internal -= 1
        return
      }
      if (disposed || state.value === 'closing')
        return
      clear()
      const wasOpen = state.value !== 'closed'
      state.value = 'closed'
      settle()

      if (props.open)
        emit('update:open', false)
      if (wasOpen)
        emit('closed')
    }

    watch(() => props.open, (open) => {
      requested = false

      if (!mounted)
        return
      if (open) {
        show()
        return
      }
      hide()
    }, { flush: 'post' })

    onMounted(() => {
      mounted = true

      if (props.open)
        show()
    })
    onBeforeUnmount(() => {
      disposed = true
      clear()

      if (element.value?.open)
        element.value.close()
      settle()
    })

    return () => (
      <dialog
        {...mergeProps(attrs, {
          'ref': element,
          'role': 'dialog',
          'aria-modal': 'true',
          'inert': !top.value || state.value === 'closing' || undefined,
          'data-ui-modal-root': '',
          'data-ui-modal-state': state.value,
          'data-ui-modal-top': top.value ? '' : undefined,
          'data-ui-modal-backdrop': top.value ? 'true' : 'false',
          [`data-ui-${props.kind}-state`]: state.value,
          'onCancel': cancel,
          'onClose': closed,
          'onClick': backdrop,
          'onKeydown': keydown,
        })}
      >
        {slots.default?.({ interactive: top.value && state.value !== 'closing' })}
      </dialog>
    )
  },
})
