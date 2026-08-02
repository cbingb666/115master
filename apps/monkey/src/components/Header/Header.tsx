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
          'ui-z-header sticky top-[var(--drive-floating-gap,calc(var(--spacing)*2))] pb-4',
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
            px-[var(--main-content-gutter,calc(var(--spacing)*6))]
            py-3
          "
        >
          {slots.default?.()}
        </div>
      </div>
    )
  },
})

export default Header
