import type { SlotsType, VNodeChild } from 'vue'
import { defineComponent } from 'vue'

/** The non-shrinking trailing action region of a Header. */
export const HeaderEnd = defineComponent({
  name: 'HeaderEnd',

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(_, { slots }) {
    return () => (
      <div class="ui-header__end flex flex-none items-center gap-2">
        {slots.default?.()}
      </div>
    )
  },
})
