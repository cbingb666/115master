import type { PropType, SlotsType, VNodeChild } from 'vue'
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

const COLORS: Record<ButtonColor, string> = {
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

const VARIANTS: Record<ButtonVariant, string> = {
  'solid': '',
  'soft': 'btn-soft',
  'outline': 'btn-outline',
  'dash': 'btn-dash',
  'ghost': 'btn-ghost',
  'link': 'btn-link',
  'glass-surface': 'btn-glass-surface',
  'glass-inset': 'btn-glass-inset',
  'glass-floating': 'btn-glass-floating',
  'glass-overlay': 'btn-glass-overlay',
}

const SIZES: Record<ButtonSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: 'btn-md',
  lg: 'btn-lg',
  xl: 'btn-xl',
}

const SHAPES: Record<ButtonShape, string> = {
  default: '',
  square: 'btn-square',
  circle: 'btn-circle',
}

const LOADERS: Record<ButtonSize, string> = {
  xs: 'loading-xs',
  sm: 'loading-xs',
  md: 'loading-sm',
  lg: 'loading-md',
  xl: 'loading-lg',
}

/**
 * 项目统一按钮。标准颜色与 daisyUI 保持一致，玻璃变体按承载场景区分。
 */
const Button = defineComponent({
  name: 'Button',

  props: {
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
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button',
    },
    title: {
      type: String,
      default: undefined,
    },
    tabindex: {
      type: [String, Number] as PropType<string | number>,
      default: undefined,
    },
    role: {
      type: String,
      default: undefined,
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
  },

  emits: ['click', 'mouseenter'] as const,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    return () => (
      <button
        type={props.type}
        title={props.title}
        tabindex={props.tabindex}
        role={props.role}
        class={[
          'btn',
          COLORS[props.color],
          VARIANTS[props.variant],
          SIZES[props.size],
          SHAPES[props.shape],
          props.active && 'btn-active',
          props.block && 'btn-block',
        ]}
        disabled={props.disabled || props.loading}
        aria-busy={props.loading || undefined}
        onClick={event => emit('click', event)}
        onMouseenter={event => emit('mouseenter', event)}
      >
        {props.loading && (
          <span
            class={['loading loading-spinner', LOADERS[props.size]]}
            aria-hidden="true"
          />
        )}
        {slots.default?.()}
      </button>
    )
  },
})

export default Button
