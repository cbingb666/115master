import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import type {
  ModalDismissReason,
  ModalInitialFocus,
} from '../Modal/ModalRoot'
import {
  defineComponent,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  watch,
} from 'vue'
import { ModalRoot } from '../Modal/ModalRoot'

export type DrawerPlacement = 'start' | 'end' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full'
export type DrawerCloseReason = ModalDismissReason | 'swipe'

const placements: Record<DrawerPlacement, string> = {
  start: 'ui-drawer--start',
  end: 'ui-drawer--end',
  bottom: 'ui-drawer--bottom',
}

const sizes: Record<DrawerSize, string> = {
  sm: 'ui-drawer--sm',
  md: 'ui-drawer--md',
  lg: 'ui-drawer--lg',
  full: 'ui-drawer--full',
}

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: undefined,
  },
  placement: {
    type: String as PropType<DrawerPlacement>,
    default: 'end',
  },
  size: {
    type: String as PropType<DrawerSize>,
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
  closeOnSwipe: {
    type: Boolean,
    default: true,
  },
  initialFocus: {
    type: [String, Object, Function] as PropType<ModalInitialFocus>,
    default: undefined,
  },
} as const

export type DrawerProps = ExtractPublicPropTypes<typeof props>

/** A controlled native modal panel without business content structure. */
export const Drawer = defineComponent({
  name: 'Drawer',

  inheritAttrs: false,

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'close': (_reason: DrawerCloseReason) => true,
    'opened': () => true,
    'closed': () => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { attrs, emit, slots }) {
    const panel = shallowRef<HTMLElement>()
    let pointer: number | undefined
    let origin = 0
    let started = 0
    let frame: number | undefined

    function reset() {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
        frame = undefined
      }
      pointer = undefined
      panel.value?.style.removeProperty('transition')
      panel.value?.style.removeProperty('transform')
    }

    function snap(target: HTMLElement) {
      target.style.removeProperty('transition')
      target.getBoundingClientRect()
      frame = requestAnimationFrame(() => {
        frame = undefined

        if (panel.value !== target)
          return
        target.style.removeProperty('transform')
      })
    }

    function down(event: PointerEvent, interactive: boolean) {
      if (
        !interactive
        || props.placement !== 'bottom'
        || !props.closeOnSwipe
        || !event.isPrimary
        || event.button !== 0
        || !(event.currentTarget instanceof HTMLElement)
        || !panel.value
      ) {
        return
      }

      pointer = event.pointerId
      origin = event.clientY
      started = event.timeStamp
      panel.value.style.transition = 'none'
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    }

    function move(event: PointerEvent) {
      if (pointer !== event.pointerId || !panel.value)
        return

      panel.value.style.transform = `translate3d(0, ${Math.max(0, event.clientY - origin)}px, 0)`
      event.preventDefault()
    }

    function release(event: PointerEvent) {
      if (pointer !== event.pointerId || !panel.value)
        return

      const handle = event.currentTarget
      const target = panel.value
      const distance = Math.max(0, event.clientY - origin)
      const velocity = distance / Math.max(1, event.timeStamp - started)
      const dismiss = distance > Math.min(96, target.offsetHeight * 0.25)
        || (distance > 24 && velocity > 0.65)

      if (handle instanceof HTMLElement && handle.hasPointerCapture(event.pointerId))
        handle.releasePointerCapture(event.pointerId)
      pointer = undefined

      if (!dismiss) {
        snap(target)
        return
      }

      target.style.removeProperty('transition')
      target.getBoundingClientRect()
      target.style.transform = `translate3d(0, ${target.offsetHeight + 32}px, 0)`
      emit('close', 'swipe')
      emit('update:open', false)
      void nextTick(() => {
        if (props.open)
          snap(target)
      })
    }

    function cancel(event: PointerEvent) {
      if (pointer !== event.pointerId || !panel.value)
        return

      if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId)
      pointer = undefined
      snap(panel.value)
    }

    watch(() => props.open, (open) => {
      if (open)
        reset()
    })
    onBeforeUnmount(reset)

    return () => {
      const label = props.label?.trim()
        || (typeof attrs['aria-label'] === 'string' ? attrs['aria-label'].trim() : undefined)

      return (
        <ModalRoot
          kind="drawer"
          open={props.open}
          closeOnEscape={props.closeOnEscape}
          closeOnBackdrop={props.closeOnBackdrop}
          initialFocus={props.initialFocus}
          {...mergeProps(attrs, {
            'class': ['ui-drawer', placements[props.placement], sizes[props.size]],
            'aria-label': label || undefined,
            'data-ui-drawer-placement': props.placement,
            'data-ui-drawer-size': props.size,
            'onUpdate:open': (open: boolean) => emit('update:open', open),
            'onClose': (reason: ModalDismissReason) => emit('close', reason),
            'onOpened': () => emit('opened'),
            'onClosed': () => emit('closed'),
          })}
        >
          {(options: { interactive: boolean }) => (
            <div ref={panel} class="ui-drawer__panel ui-glass-panel" data-ui-drawer-panel="">
              {props.placement === 'bottom' && (
                <div
                  class="ui-drawer__handle"
                  aria-hidden="true"
                  data-ui-drawer-drag-handle=""
                  onPointerdown={event => down(event, options.interactive)}
                  onPointermove={move}
                  onPointerup={release}
                  onPointercancel={cancel}
                />
              )}
              {slots.default?.()}
            </div>
          )}
        </ModalRoot>
      )
    }
  },
})
