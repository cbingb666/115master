import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent, h } from 'vue'

export type PillAs = 'span' | 'div' | 'a'

export type PillVariant
  = | 'plain'
    | 'glass-surface'
    | 'glass-floating'
    | 'glass-overlay'

export type PillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const pillProps = {
  as: {
    type: String as PropType<PillAs>,
    default: 'span',
  },
  href: String,
  variant: {
    type: String as PropType<PillVariant>,
    default: 'plain',
  },
  size: {
    type: String as PropType<PillSize>,
    default: 'md',
  },
} as const

export type PillProps = ExtractPublicPropTypes<typeof pillProps>

const variants: Record<PillVariant, string> = {
  'plain': '',
  'glass-surface': 'ui-glass-surface',
  'glass-floating': 'ui-glass-floating',
  'glass-overlay': 'ui-glass-overlay',
}

const sizes: Record<PillSize, string> = {
  xs: 'ui-pill-xs',
  sm: 'ui-pill-sm',
  md: 'ui-pill-md',
  lg: 'ui-pill-lg',
  xl: 'ui-pill-xl',
}

/**
 * 胶囊几何的信息、组合布局或导航容器；动作必须使用 Button。
 */
const Pill = defineComponent({
  name: 'Pill',

  props: pillProps,

  emits: {
    click: (_event: MouseEvent) => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { emit, slots }) {
    const children = () => {
      const nodes = slots.default?.()

      if (nodes == null)
        return []
      return Array.isArray(nodes) ? nodes : [nodes]
    }

    function element() {
      if (props.as === 'a' && !props.href)
        throw new Error('Pill rendered as a link requires href.')
      return props.as
    }

    return () => h(
      element(),
      {
        class: [
          'ui-pill',
          variants[props.variant],
          sizes[props.size],
        ],
        href: props.as === 'a' ? props.href : undefined,
        onClick: props.as === 'a'
          ? (event: MouseEvent) => emit('click', event)
          : undefined,
      },
      children(),
    )
  },
})

export { Pill }
