import type { SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'
import './Header.css'

const styles = clsx({
  root: [
    'relative',
    'h-[var(--drive-header-height)]',
  ],
  header: [
    'fixed',
    'top-[var(--navbar-height)]',
    'left-[calc(var(--sider-width)+var(--spacing)*4)]',
    'right-[calc(var(--spacing)*4)]',
    'z-100',
    'h-14',
    'px-4',
    'mx-auto',
    'gap-2',
    'flex',
    'items-center',
    'justify-between',
    'h-[var(--drive-header-height)]',
    'bg-base-200/70',
    'liquid-glass',
    'rounded-2xl',
    'before:backdrop-blur-xl',
    'before:rounded-2xl',
    'after:rounded-2xl',
    'header-scroll-effect',
    'will-change-transform',
  ],
})

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
    return () => {
      return (
        <div class={[styles.root, props.class]}>
          <div class={styles.header}>
            {slots.default?.()}
          </div>
        </div>
      )
    }
  },
})

export default Header
