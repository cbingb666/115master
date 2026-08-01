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
import { defineComponent, shallowRef, Transition, watch } from 'vue'
import { Button } from '../Button/Button'
import { Dialog } from '../Dialog/Dialog'

export type NavigationStackDismissReason
  = | 'button'
    | Extract<DialogCloseReason, 'escape' | 'backdrop'>
export type NavigationStackPageKey = string | number
export type NavigationStackDirection = 'forward' | 'back' | 'replace'

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

    watch(
      () => [props.pageKey, props.depth] as const,
      ([pageKey, depth], [previousPageKey, previousDepth]) => {
        if (Object.is(pageKey, previousPageKey) && depth === previousDepth)
          return

        direction.value = depth > previousDepth
          ? 'forward'
          : depth < previousDepth
            ? 'back'
            : 'replace'
      },
      { flush: 'sync' },
    )

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
          class="ui-navigation-stack-dialog"
          onUpdate:open={open => emit('update:open', open)}
          onClose={reason => emit('dismiss', reason)}
        >
          <div
            class="ui-navigation-stack"
            data-ui-navigation-stack=""
            data-ui-navigation-direction={direction.value}
          >
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
              <div class="ui-navigation-stack__content">
                <Transition name={`ui-navigation-stack-page-${direction.value}`}>
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
