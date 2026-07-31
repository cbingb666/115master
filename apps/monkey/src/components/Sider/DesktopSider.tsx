import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import SiderMenuButton from './SiderMenuButton'

const DesktopSider = defineComponent({
  name: 'DesktopSider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) {
    return () => (
      <div
        class="
          ui-glass-panel
          ui-z-header
          fixed top-2
          bottom-2 left-2
          flex
          w-[calc(var(--sider-width)-var(--spacing)*4)]
          flex-col
          rounded-2xl
          px-4
          pb-4
          max-sm:hidden
        "
      >
        {slots.default?.()}
        <div class="mt-auto flex flex-col gap-4">
          {slots.left?.()}
          <SiderMenuButton />
        </div>
      </div>
    )
  },
})

export default DesktopSider
