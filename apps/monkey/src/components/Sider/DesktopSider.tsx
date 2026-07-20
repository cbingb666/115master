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
          border-base-content/10 bg-base-100/60
          fixed
          top-2 bottom-2
          left-2 z-100
          flex
          w-[calc(var(--sider-width)-var(--spacing)*4)]
          flex-col
          rounded-2xl
          border
          px-4
          pb-4
          shadow-2xl
          backdrop-blur-xl
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
