import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

export type PillVariant
  = | 'plain'
    | 'glass-surface'
    | 'glass-floating'
    | 'glass-overlay'

export type PillSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const VARIANTS: Record<PillVariant, string> = {
  'plain': '',
  'glass-surface': 'app-glass-surface',
  'glass-floating': 'app-glass-floating',
  'glass-overlay': 'app-glass-overlay',
}

const SIZES: Record<PillSize, string> = {
  xs: 'pill-xs',
  sm: 'pill-sm',
  md: 'pill-md',
  lg: 'pill-lg',
  xl: 'pill-xl',
}

/**
 * 胶囊容器。几何、尺寸与承载材质通过显式属性组合。
 */
const Pill = defineComponent({
  name: 'Pill',
  props: {
    /**
     * 渲染标签；动作必须使用 Button，Pill 只提供容器或链接语义。
     */
    as: {
      type: String as PropType<'span' | 'div' | 'a'>,
      default: 'span',
    },
    href: {
      type: String,
      default: undefined,
    },
    class: {
      type: String,
      default: '',
    },
    variant: {
      type: String as PropType<PillVariant>,
      default: 'plain',
    },
    size: {
      type: String as PropType<PillSize>,
      default: 'md',
    },
  },
  emits: {
    click: (_event: MouseEvent) => true,
  },
  setup: (props, { emit, slots }) => {
    return () => h(
      props.as,
      {
        href: props.as === 'a' ? props.href : undefined,
        onClick: props.as === 'a'
          ? (event: MouseEvent) => emit('click', event)
          : undefined,
        class: [
          'pill',
          VARIANTS[props.variant],
          SIZES[props.size],
          props.class,
        ],
      },
      slots.default?.(),
    )
  },
})

export default Pill
