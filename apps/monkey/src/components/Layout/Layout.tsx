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
          app-bg-mesh min-h-screen
          [--sider-width:0]
          sm:[--sider-width:calc(var(--spacing)*64)]
        "
      >
        {slots.default?.()}
      </div>
    )
  },
})

export default Layout
