import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import './Header.css'

const Header = defineComponent({
  name: 'Header',
  props: {
    class: {
      type: String,
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
          'sticky top-2 z-100 px-2 pb-4',
          props.class,
        ]}
      >
        <div class="
            header-sticky-effect
            @container
            flex
            min-w-0
            items-center
            justify-between
            gap-2
            overflow-hidden
            py-3 pr-2
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
