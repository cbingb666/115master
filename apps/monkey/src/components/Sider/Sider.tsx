import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import DesktopSider from './DesktopSider'
import MobileSider from './MobileSider'

const Sider = defineComponent({
  name: 'Sider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) {
    return () => (
      <>
        <DesktopSider>
          {{ default: slots.default, left: slots.left }}
        </DesktopSider>
        <MobileSider>
          {{ default: slots.default, left: slots.left }}
        </MobileSider>
      </>
    )
  },
})

export default Sider
