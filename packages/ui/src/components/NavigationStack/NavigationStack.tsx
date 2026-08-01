import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import type {
  DialogCloseReason,
  DialogInitialFocus,
  DialogSize,
} from '../Dialog/Dialog'
import { defineComponent, onBeforeUnmount, shallowRef, Transition, watch } from 'vue'
import { Button } from '../Button/Button'
import { Dialog } from '../Dialog/Dialog'

export type NavigationStackDismissReason
  = | 'button'
    | 'swipe'
    | Extract<DialogCloseReason, 'escape' | 'backdrop'>
export type NavigationStackPageKey = string | number
export type NavigationStackDirection = 'forward' | 'back' | 'replace'
export type NavigationStackMobilePresentation = 'fullscreen' | 'sheet'

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  pageKey: {
    type: [String, Number] as PropType<NavigationStackPageKey>,
    required: true,
  },
  depth: {
    type: Number,
    default: 0,
    validator: (value: number) => Number.isInteger(value) && value >= 0,
  },
  mobilePresentation: {
    type: String as PropType<NavigationStackMobilePresentation>,
    default: 'fullscreen',
  },
  canGoBack: {
    type: Boolean,
    default: false,
  },
  backLabel: {
    type: String,
    default: undefined,
  },
  closeLabel: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<DialogSize>,
    default: 'lg',
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
} as const

export type NavigationStackProps = ExtractPublicPropTypes<typeof props>

function BackIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  )
}

/**
 * A controlled stack for temporary navigation. It keeps modal lifecycle in the
 * Dialog primitive, infers transition direction from page identity and depth,
 * and leaves the caller in charge of navigation state and localized labels.
 */
export const NavigationStack = defineComponent({
  name: 'NavigationStack',

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'back': () => true,
    'dismiss': (_reason: NavigationStackDismissReason) => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    actions?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    const direction = shallowRef<NavigationStackDirection>('replace')
    const content = shallowRef<HTMLElement>()
    let height: number | undefined
    let frame: number | undefined
    let settle: number | undefined
    let pointer: number | undefined
    let origin = 0
    let started = 0
    let panel: HTMLElement | undefined

    function sheet() {
      return props.mobilePresentation === 'sheet'
        && typeof window !== 'undefined'
        && window.matchMedia('(width < 40rem)').matches
    }

    function resized() {
      if (frame !== undefined) {
        cancelAnimationFrame(frame)
        frame = undefined
      }
      content.value?.style.removeProperty('height')
      height = undefined
    }

    function resize(element: Element) {
      const container = content.value

      if (!container || height === undefined || !sheet())
        return

      container.style.height = `${Math.ceil(height)}px`
      container.getBoundingClientRect()
      frame = requestAnimationFrame(() => {
        frame = undefined

        if (content.value !== container)
          return
        container.style.height = `${Math.ceil((element as HTMLElement).scrollHeight)}px`
      })
    }

    function reset() {
      if (settle !== undefined) {
        cancelAnimationFrame(settle)
        settle = undefined
      }
      pointer = undefined
      panel?.style.removeProperty('transition')
      panel?.style.removeProperty('transform')
      panel = undefined
    }

    function down(event: PointerEvent) {
      if (!sheet() || !event.isPrimary || event.button !== 0)
        return
      if (!(event.currentTarget instanceof HTMLElement))
        return

      const element = event.currentTarget.closest<HTMLElement>('[data-ui-dialog-panel]')

      if (!element)
        return

      pointer = event.pointerId
      origin = event.clientY
      started = event.timeStamp
      panel = element
      element.style.transition = 'none'
      event.currentTarget.setPointerCapture(event.pointerId)
      event.preventDefault()
    }

    function move(event: PointerEvent) {
      if (pointer !== event.pointerId || !panel)
        return

      panel.style.transform = `translate3d(0, ${Math.max(0, event.clientY - origin)}px, 0)`
      event.preventDefault()
    }

    function up(event: PointerEvent) {
      if (pointer !== event.pointerId || !panel)
        return

      const target = event.currentTarget
      const element = panel
      const distance = Math.max(0, event.clientY - origin)
      const velocity = distance / Math.max(1, event.timeStamp - started)
      const dismiss = distance > Math.min(96, element.offsetHeight * 0.25)
        || (distance > 24 && velocity > 0.65)

      if (target instanceof HTMLElement && target.hasPointerCapture(event.pointerId))
        target.releasePointerCapture(event.pointerId)

      pointer = undefined
      element.style.removeProperty('transition')
      element.getBoundingClientRect()
      settle = requestAnimationFrame(() => {
        settle = undefined

        if (!dismiss) {
          element.style.removeProperty('transform')
          panel = undefined
          return
        }

        element.style.transform = `translate3d(0, ${element.offsetHeight + 32}px, 0)`
        emit('dismiss', 'swipe')
        emit('update:open', false)
      })
    }

    watch(
      () => [props.pageKey, props.depth] as const,
      ([pageKey, depth], [previousPageKey, previousDepth]) => {
        if (Object.is(pageKey, previousPageKey) && depth === previousDepth)
          return

        height = sheet() ? content.value?.getBoundingClientRect().height : undefined
        direction.value = depth > previousDepth
          ? 'forward'
          : depth < previousDepth
            ? 'back'
            : 'replace'
      },
      { flush: 'sync' },
    )

    watch(() => props.open, (open) => {
      if (open)
        reset()
    })

    onBeforeUnmount(() => {
      resized()
      reset()
    })

    function dismiss() {
      emit('dismiss', 'button')
      emit('update:open', false)
    }

    return () => {
      const title = props.title.trim()
      const close = props.closeLabel.trim()
      const back = props.backLabel?.trim()

      if (!title)
        throw new Error('NavigationStack requires a non-empty title.')
      if (!close)
        throw new Error('NavigationStack requires a non-empty closeLabel.')
      if (props.canGoBack && !back)
        throw new Error('NavigationStack requires backLabel when canGoBack is true.')

      return (
        <Dialog
          open={props.open}
          label={title}
          size={props.size}
          closeOnEscape={props.closeOnEscape}
          closeOnBackdrop={props.closeOnBackdrop}
          initialFocus={props.initialFocus}
          class={[
            'ui-navigation-stack-dialog',
            `ui-navigation-stack-dialog--mobile-${props.mobilePresentation}`,
          ]}
          onUpdate:open={open => emit('update:open', open)}
          onClose={reason => emit('dismiss', reason)}
        >
          <div
            class="ui-navigation-stack"
            data-ui-navigation-stack=""
            data-ui-navigation-direction={direction.value}
            data-ui-navigation-mobile-presentation={props.mobilePresentation}
          >
            {props.mobilePresentation === 'sheet' && (
              <div
                class="ui-navigation-stack__handle"
                aria-hidden="true"
                data-ui-navigation-drag-handle=""
                onPointerdown={down}
                onPointermove={move}
                onPointerup={up}
                onPointercancel={up}
              />
            )}

            <header class="ui-navigation-stack__header">
              <div class="ui-navigation-stack__leading">
                <Transition name="ui-navigation-stack-back">
                  {props.canGoBack && (
                    <Button
                      key="back"
                      variant="ghost"
                      shape="square"
                      aria-label={back}
                      title={back}
                      onClick={() => emit('back')}
                    >
                      <BackIcon />
                    </Button>
                  )}
                </Transition>
              </div>

              <div class="ui-navigation-stack__titles">
                <Transition name={`ui-navigation-stack-title-${direction.value}`}>
                  <h2 key={props.pageKey} class="ui-navigation-stack__title">{title}</h2>
                </Transition>
              </div>

              <Button
                variant="ghost"
                shape="square"
                aria-label={close}
                title={close}
                onClick={dismiss}
              >
                <CloseIcon />
              </Button>
            </header>

            {slots.default && (
              <div ref={content} class="ui-navigation-stack__content">
                <Transition
                  name={`ui-navigation-stack-page-${direction.value}`}
                  onBeforeEnter={resize}
                  onAfterEnter={resized}
                  onEnterCancelled={resized}
                >
                  <div key={props.pageKey} class="ui-navigation-stack__page">
                    {slots.default()}
                  </div>
                </Transition>
              </div>
            )}

            {slots.actions && (
              <footer class="ui-navigation-stack__actions">
                {slots.actions()}
              </footer>
            )}
          </div>
        </Dialog>
      )
    }
  },
})
