import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent } from 'vue'

export type ButtonColor
  = | 'default'
    | 'neutral'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'

export type ButtonVariant
  = | 'solid'
    | 'soft'
    | 'outline'
    | 'dash'
    | 'ghost'
    | 'link'
    | 'glass-surface'
    | 'glass-inset'
    | 'glass-floating'
    | 'glass-overlay'

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ButtonShape = 'default' | 'square' | 'circle'
export type ButtonType = 'button' | 'submit' | 'reset'

const colors: Record<ButtonColor, string> = {
  default: '',
  neutral: 'btn-neutral',
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  accent: 'btn-accent',
  info: 'btn-info',
  success: 'btn-success',
  warning: 'btn-warning',
  error: 'btn-error',
}

const variants: Record<ButtonVariant, string> = {
  'solid': '',
  'soft': 'btn-soft',
  'outline': 'btn-outline',
  'dash': 'btn-dash',
  'ghost': 'btn-ghost',
  'link': 'btn-link',
  'glass-surface': 'ui-glass-surface',
  'glass-inset': 'ui-glass-inset',
  'glass-floating': 'ui-glass-floating',
  'glass-overlay': 'ui-glass-overlay',
}

const sizes: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
}

const shapes: Record<ButtonShape, string> = {
  default: '',
  square: 'btn-square',
  circle: 'btn-circle',
}

const loaders: Record<ButtonSize, string> = {
  xs: 'loading-xs',
  sm: 'loading-xs',
  md: 'loading-sm',
  lg: 'loading-md',
  xl: 'loading-lg',
}

const props = {
  color: {
    type: String as PropType<ButtonColor>,
    default: 'default',
  },
  variant: {
    type: String as PropType<ButtonVariant>,
    default: 'solid',
  },
  size: {
    type: String as PropType<ButtonSize>,
    default: 'md',
  },
  shape: {
    type: String as PropType<ButtonShape>,
    default: 'default',
  },
  type: {
    type: String as PropType<ButtonType>,
    default: 'button',
  },
  active: {
    type: Boolean,
    default: false,
  },
  block: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
} as const

export type ButtonProps = ExtractPublicPropTypes<typeof props>

/**
 * An application-agnostic native action button. Link and Glass variants only
 * affect its appearance; the rendered control always remains a button.
 */
export const Button = defineComponent({
  name: 'Button',

  props,

  emits: {
    click: (_event: MouseEvent) => true,
    mouseenter: (_event: MouseEvent) => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    return () => (
      <button
        type={props.type}
        class={[
          'btn',
          'ui-button',
          colors[props.color],
          variants[props.variant],
          sizes[props.size],
          shapes[props.shape],
          props.active && 'btn-active',
          props.block && 'btn-block',
        ]}
        disabled={props.disabled || props.loading}
        aria-busy={props.loading || undefined}
        onClick={(event) => {
          if (props.disabled || props.loading)
            return
          emit('click', event)
        }}
        onMouseenter={event => emit('mouseenter', event)}
      >
        {props.loading && (
          <span
            class={['loading', 'loading-spinner', loaders[props.size]]}
            aria-hidden="true"
          />
        )}
        {slots.default?.()}
      </button>
    )
  },
})
