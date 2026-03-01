import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import './Header.css'

const Header = defineComponent({
  name: 'Header',
  props: {
    class: {
      type: Object as any,
      default: '',
    },
  },
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (props, { slots }) => {
    return () => (
      <div
        class={[
          'sticky top-3 z-100 overflow-hidden px-3',
          props.class,
        ]}
      >
        <div class="
            header-sticky-effect
            flex
            min-w-0
            items-center
            justify-between
            gap-2
            overflow-hidden
            rounded-full
            border-2
            border-transparent
            py-1 pr-2
            pl-4
          "
        >
          {slots.default?.()}
        </div>
      </div>
    )
  },
})

export default Header
