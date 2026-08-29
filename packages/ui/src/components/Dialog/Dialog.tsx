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
import { computed, defineComponent, mergeProps, useId } from 'vue'
import { filled } from '../content'
import { ModalRoot } from '../Modal/ModalRoot'
import { scrollbar } from '../Scrollbar/Scrollbar'

export type DialogSize = 'md' | 'lg' | 'xl' | 'full'
export type DialogCloseReason
  = | 'confirm'
    | 'cancel'
    | ModalDismissReason
    | 'programmatic'
    | 'destroy'
    | 'close-all'

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
  immersive: {
    type: Boolean,
    default: false,
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

export type DialogProps = ExtractPublicPropTypes<typeof props>

/** A controlled command surface with an opinionated content and action shell. */
export const Dialog = defineComponent({
  name: 'Dialog',

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
    default?: () => VNodeChild
    title?: () => VNodeChild
    description?: () => VNodeChild
    actions?: () => VNodeChild
  }>,

  setup(props, { attrs, emit, slots }) {
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

    return () => (
      <ModalRoot
        kind="dialog"
        open={props.open}
        closeOnEscape={props.closeOnEscape}
        closeOnBackdrop={props.closeOnBackdrop}
        initialFocus={props.initialFocus}
        {...mergeProps(attrs, {
          'class': ['ui-dialog', sizes[props.size], props.immersive && 'ui-dialog--immersive'],
          'aria-label': titled.value ? undefined : label.value,
          'aria-labelledby': titled.value ? titleId : attrs['aria-labelledby'],
          'aria-describedby': described.value ? descriptionId : attrs['aria-describedby'],
          'data-ui-dialog-immersive': props.immersive || undefined,
          'data-ui-dialog-size': props.size,
          'onUpdate:open': (open: boolean) => emit('update:open', open),
          'onClose': (reason: ModalDismissReason) => emit('close', reason),
          'onKeydown': (event: KeyboardEvent) => emit('keydown', event),
          'onOpened': () => emit('opened'),
          'onClosed': () => emit('closed'),
        })}
      >
        <div class={['ui-dialog__panel', 'ui-glass-panel']} data-ui-dialog-panel="">
          {(titled.value || described.value) && (
            <div class="ui-dialog__top">
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
            </div>
          )}

          {slots.default && <div class={['ui-dialog__content', ...scrollbar()]}>{slots.default()}</div>}

          {slots.actions && <footer class="ui-dialog__actions">{slots.actions()}</footer>}
        </div>
      </ModalRoot>
    )
  },
})
