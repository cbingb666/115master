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
          border-base-content/5 bg-base-100/30
          fixed
          top-0 bottom-0
          left-0 z-100
          flex
          w-(--sider-width)
          flex-col
          border-r
          px-4
          pb-4
          shadow-2xl
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
