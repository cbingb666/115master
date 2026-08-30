import type { SlotsType, VNodeChild } from 'vue'
import { defineComponent } from 'vue'

/**
 * The flexible primary region of a Header. Long content shrinks instead of
 * forcing the trailing actions outside the available width.
 */
export const HeaderStart = defineComponent({
  name: 'HeaderStart',

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(_, { slots }) {
    return () => (
      <div class="ui-header__start relative -my-2 flex min-w-0 flex-1 items-center gap-2 overflow-x-clip overflow-y-visible py-2">
        {slots.default?.()}
      </div>
    )
  },
})
