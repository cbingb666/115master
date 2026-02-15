import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import './Navbar.css'

const Navbar = defineComponent({
  name: 'Navbar',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <>
        {/* frosted glass */}
        <div class="pointer-events-none fixed inset-x-0 top-0 z-100 h-(--navbar-frosted-glass-height)" />

        {/* navbar */}
        <div class="navbar-shadow-scroll flex h-(--navbar-height) flex-col">

          {/* navbar content */}
          <div class="fixed top-0 right-0 left-(--sider-width) z-100 flex h-(--navbar-height) items-center justify-between">

            {/* left */}
            <div class="h-full flex-none items-center sm:block">
              {slots.left?.()}
            </div>

            {/* center */}
            <div class="flex h-full flex-1 items-center justify-center px-4">
              {slots.default?.()}
            </div>

            {/* right */}
            <div class="flex h-full flex-none items-center">
              {slots.right?.()}
            </div>
          </div>
        </div>
      </>
    )
  },
})

export default Navbar
