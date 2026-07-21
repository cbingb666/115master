import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'

/**
 * Header 主内容区（左）：可收缩，内容超长时收缩截断而非撑破布局
 */
const HeaderStart = defineComponent({
  name: 'HeaderStart',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      // min-w-0：flex 子项默认 min-width:auto，缺了它长内容会撑破布局
      <div class="relative flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
        {slots.default?.()}
      </div>
    )
  },
})

export default HeaderStart
