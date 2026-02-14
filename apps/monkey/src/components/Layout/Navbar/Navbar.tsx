import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'
import './Navbar.css'

const styles = clsx({
  navbar: [
    'flex',
    'flex-col',
    'h-[var(--navbar-height)]',
    'navbar-shadow-scroll',
  ],
  header: [
    'fixed',
    'top-0',
    'left-[var(--sider-width)]',
    'right-0',
    'z-100',
    'h-[var(--navbar-height)]',
    'flex',
    'items-center',
    'justify-between',
  ],
  left: [
    'flex-none',
    'sm:block',
    'h-full',
    'items-center',
  ],
  center: [
    'flex-1',
    'flex',
    'items-center',
    'justify-center',
    'px-4',
    'h-full',
  ],
  right: [
    'flex-none',
    'h-full',
    'flex',
    'items-center',
  ],
  frostedGlass: [
    'fixed',
    'inset-x-0',
    'top-0',
    'z-100',
    'h-[var(--navbar-frosted-glass-height)]',
    'pointer-events-none',
  ],
})

/**
 * 导航栏组件
 */
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
        <div class={[styles.frostedGlass]} />

        <div class={[styles.navbar]}>
          <div class={styles.header}>
            <div class={styles.left}>
              {slots.left?.()}
            </div>
            <div class={styles.center}>
              {slots.default?.()}
            </div>
            <div class={styles.right}>
              {slots.right?.()}
            </div>
          </div>
        </div>
      </>
    )
  },
})

export default Navbar
