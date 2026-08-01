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
  useId,
  watch,
} from 'vue'
import { filled } from '../content'

export type DialogSize = 'md' | 'lg' | 'xl' | 'full'
export type DialogCloseReason
  = | 'confirm'
    | 'cancel'
    | 'escape'
    | 'backdrop'
    | 'programmatic'
    | 'destroy'
    | 'close-all'
export type DialogInitialFocus
  = | HTMLElement
    | string
    | (() => HTMLElement | null | undefined)

type DialogDismissReason = Extract<DialogCloseReason, 'escape' | 'backdrop'>
type DialogState = 'closed' | 'opening' | 'open' | 'closing'

const sizes: Record<DialogSize, string> = {
  md: 'ui-dialog--md',
  lg: 'ui-dialog--lg',
  xl: 'ui-dialog--xl',
  full: 'ui-dialog--full',
}

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: undefined,
  },
  description: {
    type: String,
    default: undefined,
  },
  label: {
    type: String,
    default: undefined,
  },
  size: {
    type: String as PropType<DialogSize>,
    default: 'md',
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
    type: [String, Object, Function] as PropType<DialogInitialFocus>,
    default: undefined,
  },
  inert: {
    type: Boolean,
    default: false,
  },
} as const

export type DialogProps = ExtractPublicPropTypes<typeof props>

function milliseconds(value: string) {
  const number = Number.parseFloat(value)

  if (Number.isNaN(number))
    return 0
  return value.trim().endsWith('ms') ? number : number * 1000
}

function transition(element: HTMLElement) {
  const style = getComputedStyle(element)
  const durations = style.transitionDuration.split(',').map(milliseconds)
  const delays = style.transitionDelay.split(',').map(milliseconds)

  return Math.max(0, ...durations.map((duration, index) => duration + (delays[index % delays.length] ?? 0)))
}

/**
 * A controlled native modal. It provides the modal shell and lifecycle while
 * applications provide content and localized Button actions through slots.
 */
export const Dialog = defineComponent({
  name: 'Dialog',

  inheritAttrs: false,

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'close': (_reason: DialogDismissReason) => true,
    'keydown': (_event: KeyboardEvent) => true,
    'opened': () => true,
    'closed': () => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    title?: () => VNodeChild
    description?: () => VNodeChild
    actions?: () => VNodeChild
  }>,

  setup(props, { attrs, emit, slots }) {
    const dialog = shallowRef<HTMLDialogElement>()
    const previous = shallowRef<HTMLElement>()
    const mounted = shallowRef(false)
    const state = shallowRef<DialogState>('closed')
    const titleId = `ui-dialog-title-${useId()}`
    const descriptionId = `ui-dialog-description-${useId()}`
    const title = computed(() => {
      const nodes = slots.title?.()

      if (filled(nodes))
        return nodes
      return props.title?.trim() || undefined
    })
    const description = computed(() => {
      const nodes = slots.description?.()

      if (filled(nodes))
        return nodes
      return props.description?.trim() || undefined
    })
    const titled = computed(() => title.value !== undefined)
    const described = computed(() => description.value !== undefined)
    const label = computed(() => {
      if (props.label?.trim())
        return props.label.trim()
      const value = attrs['aria-label']
      return typeof value === 'string' && value.trim() ? value.trim() : undefined
    })
    let timer: ReturnType<typeof setTimeout> | undefined
    let frame: number | undefined
    let listener: ((event: TransitionEvent) => void) | undefined
    let watched: HTMLDialogElement | undefined
    let requested = false
    let internalCloseEvents = 0
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
      const element = dialog.value

      if (!element) {
        done()
        return
      }

      const duration = transition(element)

      if (duration === 0) {
        done()
        return
      }

      const finish = () => {
        clear()
        done()
      }

      listener = (event) => {
        if (event.target !== element)
          return
        finish()
      }
      watched = element
      element.addEventListener('transitionend', listener)
      element.addEventListener('transitioncancel', listener)
      timer = setTimeout(finish, duration)
    }

    function restore() {
      const element = previous.value
      previous.value = undefined

      if (!element || !element.isConnected || element.matches(':disabled'))
        return
      element.focus({ preventScroll: true })
    }

    function target() {
      const element = dialog.value
      const value = typeof props.initialFocus === 'function'
        ? props.initialFocus()
        : props.initialFocus

      if (!element || !value)
        return undefined
      if (typeof value === 'string')
        return element.querySelector<HTMLElement>(value) ?? undefined
      if (value instanceof HTMLElement && element.contains(value))
        return value
      return undefined
    }

    function focus() {
      const element = target()
        ?? dialog.value?.querySelector<HTMLElement>(
          '[autofocus], button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
        )
        ?? dialog.value

      element?.focus({ preventScroll: true })
    }

    function completeOpen(element: HTMLDialogElement) {
      if (!props.open || state.value !== 'open' || dialog.value !== element || !element.open)
        return
      emit('opened')
    }

    function promote(element: HTMLDialogElement) {
      if (!props.open || dialog.value !== element || !element.open)
        return

      const open = () => {
        if (!props.open || dialog.value !== element || !element.open)
          return
        state.value = 'open'
        nextTick(() => wait(() => completeOpen(element)))
      }

      if (transition(element) === 0) {
        open()
        return
      }

      frame = requestAnimationFrame(() => {
        frame = undefined
        open()
      })
    }

    function completeClose(element: HTMLDialogElement) {
      if (props.open || state.value !== 'closing' || dialog.value !== element)
        return

      if (element.open) {
        internalCloseEvents += 1
        element.close()
      }
      state.value = 'closed'
      restore()
      emit('closed')
    }

    function show() {
      clear()

      const element = dialog.value

      if (!element)
        return
      if (!titled.value && !label.value)
        throw new Error('Dialog requires a title, title slot, or label.')
      if (!element.open)
        previous.value = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
      state.value = 'opening'

      nextTick(() => {
        if (disposed || !props.open || dialog.value !== element)
          return
        if (!element.open)
          element.showModal()
        focus()
        promote(element)
      })
    }

    function hide() {
      clear()

      const element = dialog.value

      if (!element?.open) {
        state.value = 'closed'
        return
      }
      state.value = 'closing'

      nextTick(() => {
        if (props.open || state.value !== 'closing' || dialog.value !== element)
          return
        wait(() => completeClose(element))
      })
    }

    function request(reason: DialogDismissReason) {
      if (requested || state.value === 'closing')
        return
      requested = true
      emit('close', reason)
      emit('update:open', false)
      nextTick(() => {
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
      if (internalCloseEvents > 0) {
        internalCloseEvents -= 1
        return
      }
      if (disposed || state.value === 'closing')
        return
      clear()
      const wasOpen = state.value !== 'closed'
      state.value = 'closed'
      restore()

      if (props.open)
        emit('update:open', false)
      if (wasOpen)
        emit('closed')
    }

    watch(() => props.open, (open) => {
      requested = false

      if (!mounted.value)
        return
      if (open) {
        show()
        return
      }
      hide()
    }, { flush: 'post' })

    onMounted(() => {
      mounted.value = true

      if (props.open)
        show()
    })
    onBeforeUnmount(() => {
      disposed = true
      clear()

      if (dialog.value?.open)
        dialog.value.close()
      restore()
    })

    return () => (
      <dialog
        {...mergeProps(attrs, {
          'ref': dialog,
          'class': ['ui-dialog', sizes[props.size]],
          'role': 'dialog',
          'aria-modal': 'true',
          'aria-label': titled.value ? undefined : label.value,
          'aria-labelledby': titled.value ? titleId : undefined,
          'aria-describedby': described.value ? descriptionId : undefined,
          'inert': props.inert || undefined,
          'data-ui-dialog-size': props.size,
          'data-ui-dialog-state': state.value,
          'onCancel': cancel,
          'onClose': closed,
          'onClick': backdrop,
          'onKeydown': keydown,
        })}
      >
        <div class={['ui-dialog__panel', 'ui-glass-panel']} data-ui-dialog-panel="">
          {titled.value && (
            <header class="ui-dialog__header">
              <h2 id={titleId} class="ui-dialog__title">
                {title.value}
              </h2>
            </header>
          )}

          {described.value && (
            <div id={descriptionId} class="ui-dialog__description">
              {description.value}
            </div>
          )}

          {slots.default && <div class="ui-dialog__content">{slots.default()}</div>}

          {slots.actions && <footer class="ui-dialog__actions">{slots.actions()}</footer>}
        </div>
      </dialog>
    )
  },
})
