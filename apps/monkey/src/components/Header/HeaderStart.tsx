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
      // -my-3 + py-3：overflow-hidden 会裁掉子元素的玻璃阴影，padding 给阴影留出渲染空间，负 margin 保持布局不变
      <div class="relative -my-3 flex min-w-0 flex-1 items-center gap-2 overflow-hidden py-3">
        {slots.default?.()}
      </div>
    )
  },
})

export default HeaderStart
