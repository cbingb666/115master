import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  layout: [
    'min-h-screen',
    '[--sider-width:0] sm:[--sider-width:calc(var(--spacing)*46)]',
    '[--navbar-height:calc(var(--spacing)*18)]',
  ],
})

/**
 * 布局组件
 */
const Layout = defineComponent({
  name: 'Layout',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div class={styles.layout}>
        {slots.default?.()}
      </div>
    )
  },
})

export default Layout
