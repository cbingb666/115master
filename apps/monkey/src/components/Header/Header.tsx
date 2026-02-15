import type { SlotsType } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { defineComponent, shallowRef } from 'vue'

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
    const rootRef = shallowRef<HTMLElement>()
    const isFixed = shallowRef(false)
    useIntersectionObserver(
      rootRef,
      (e, f) => {
        const [entry] = e
        console.log(e, f)
        isFixed.value = entry.intersectionRatio < 1
      },
      {
        threshold: [0, 1],
        rootMargin: `-16px 0px 0px 0px`,
      },
    )

    return () => {
      return (
        <div
          ref={rootRef}
          class={[
            'relative',
            'h-(--drive-header-height)',
            'group',
            props.class,
          ]}
          data-fixed={isFixed.value}
        >
          <div
            class={[
              'relative',
              'z-100',
              'h-14',
              'px-4',
              'mx-4',
              'gap-2',
              'flex',
              'items-center',
              'justify-between',
              'h-(--drive-header-height)',
              'w-100%',
              'rounded-2xl',
              'will-change-transform',
              'transition-all',
              'group-data-[fixed=true]:fixed',
              'group-data-[fixed=true]:liquid-glass',
              'group-data-[fixed=true]:before:backdrop-blur-xl',
              'group-data-[fixed=true]:before:rounded-2xl',
              'group-data-[fixed=true]:after:rounded-2xl',
              'group-data-[fixed=true]:transition-all',
              'group-data-[fixed=true]:top-4',
              'group-data-[fixed=true]:w-[calc(100%-var(--sider-width)-var(--spacing)*18)]',
              'group-data-[fixed=true]:mx-9',
            ]}
          >
            {slots.default?.()}
          </div>
        </div>
      )
    }
  },
})

export default Header
