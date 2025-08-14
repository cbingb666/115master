import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  main: 'flex-1 ml-[var(--sider-width)]',
})

/**
 * 主内容组件
 */
const Main = defineComponent({
  name: 'Main',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div class={styles.main}>
        {slots.default?.()}
      </div>
    )
  },
})

export default Main
