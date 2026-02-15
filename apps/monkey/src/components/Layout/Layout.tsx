import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'

const Layout = defineComponent({
  name: 'Layout',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div
        class="
          min-h-screen
          [--navbar-height:calc(var(--spacing)*18)] [--sider-width:0]
          sm:[--sider-width:calc(var(--spacing)*46)]
        "
      >
        {slots.default?.()}
      </div>
    )
  },
})

export default Layout
