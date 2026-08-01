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
import { defineComponent } from 'vue'
import { Button } from '../Button/Button'
import { Dialog } from '../Dialog/Dialog'

export type NavigationSurfaceDismissReason
  = | 'button'
    | Extract<DialogCloseReason, 'escape' | 'backdrop'>

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
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

export type NavigationSurfaceProps = ExtractPublicPropTypes<typeof props>

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
 * A controlled, temporary navigation surface. It keeps modal lifecycle in the
 * Dialog primitive, presents as a full-screen page on mobile, and leaves the
 * caller in charge of screen state and localized labels.
 */
export const NavigationSurface = defineComponent({
  name: 'NavigationSurface',

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'back': () => true,
    'dismiss': (_reason: NavigationSurfaceDismissReason) => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    actions?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    function dismiss() {
      emit('dismiss', 'button')
      emit('update:open', false)
    }

    return () => {
      const title = props.title.trim()
      const close = props.closeLabel.trim()
      const back = props.backLabel?.trim()

      if (!title)
        throw new Error('NavigationSurface requires a non-empty title.')
      if (!close)
        throw new Error('NavigationSurface requires a non-empty closeLabel.')
      if (props.canGoBack && !back)
        throw new Error('NavigationSurface requires backLabel when canGoBack is true.')

      return (
        <Dialog
          open={props.open}
          label={title}
          size={props.size}
          closeOnEscape={props.closeOnEscape}
          closeOnBackdrop={props.closeOnBackdrop}
          initialFocus={props.initialFocus}
          class="ui-navigation-surface-dialog"
          onUpdate:open={open => emit('update:open', open)}
          onClose={reason => emit('dismiss', reason)}
        >
          <div class="ui-navigation-surface" data-ui-navigation-surface="">
            <header class="ui-navigation-surface__header">
              <div class="ui-navigation-surface__leading">
                {props.canGoBack && (
                  <Button
                    variant="ghost"
                    shape="square"
                    aria-label={back}
                    title={back}
                    onClick={() => emit('back')}
                  >
                    <BackIcon />
                  </Button>
                )}
              </div>

              <h2 class="ui-navigation-surface__title">{title}</h2>

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
              <div class="ui-navigation-surface__content">
                {slots.default()}
              </div>
            )}

            {slots.actions && (
              <footer class="ui-navigation-surface__actions">
                {slots.actions()}
              </footer>
            )}
          </div>
        </Dialog>
      )
    }
  },
})
