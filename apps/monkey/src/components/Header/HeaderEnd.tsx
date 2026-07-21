import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'

/**
 * Header 操作区（右）：不收缩，始终完整展示
 */
const HeaderEnd = defineComponent({
  name: 'HeaderEnd',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div class="flex flex-none items-center gap-2">
        {slots.default?.()}
      </div>
    )
  },
})

export default HeaderEnd
