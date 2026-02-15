import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'

const Main = defineComponent({
  name: 'Main',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div
        class="ml-(--sider-width) flex-1"
      >
        {slots.default?.()}
      </div>
    )
  },
})

export default Main
