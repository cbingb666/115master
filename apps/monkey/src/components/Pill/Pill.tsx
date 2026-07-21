import type { PropType } from 'vue'
import { defineComponent, h } from 'vue'

/**
 * 玻璃 Pill 容器（`.pill` 的组件封装）
 */
const Pill = defineComponent({
  name: 'Pill',
  props: {
    /**
     * 渲染标签；a / button 时自动获得交互态
     */
    as: {
      type: String as PropType<'span' | 'div' | 'a' | 'button'>,
      default: 'span',
    },
    class: {
      type: String,
      default: '',
    },
  },
  setup: (props, { slots }) => {
    return () => h(props.as, { class: ['pill', props.class] }, slots.default?.())
  },
})

export default Pill
