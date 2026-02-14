import type { PropType, SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'flex',
  ],
})

/**
 * 示例组件
 * @deprecated 示例组件，请勿使用
 */
const Example = defineComponent({
  name: 'Example',
  props: {
    /**
     * 食物
     */
    food: {
      type: String,
      required: true,
    },
    /**
     * 吃东西
     */
    onEat: {
      type: Function as PropType<(food: string) => void>,
      default: () => {},
    },
  },
  slots: Object as SlotsType<{
    default: () => any
  }>,
  setup: (props, { slots }) => {
    const handleClickEat = () => {
      props.onEat(props.food)
    }

    return () => (
      <div class={styles.root}>
        <button onClick={handleClickEat}>Eat</button>
        {slots.default?.()}
      </div>
    )
  },
})

export default Example
