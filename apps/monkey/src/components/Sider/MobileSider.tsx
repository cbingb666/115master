import type { SlotsType } from 'vue'
import { defineComponent, ref } from 'vue'
import ThemeToggle from '@/components/ThemeToggle'
import { I, Icon } from '@/icons'
import Links from './Links'

const MobileSider = defineComponent({
  name: 'MobileSider',
  slots: Object as SlotsType<{
    default: () => void
    left: () => void
    right: () => void
  }>,
  setup(_, { slots }) {
    const isOpen = ref(false)
    const open = () => isOpen.value = true
    const close = () => isOpen.value = false

    return () => (
      <>
        {/* 汉堡按钮 */}
        <button
          type="button"
          aria-label="打开菜单"
          class="
            bg-primary
            text-primary-content fixed right-4 bottom-4
            z-110 flex
            h-12 w-12 items-center
            justify-center
            rounded-full shadow-lg
            transition-transform
            hover:scale-105
            active:scale-95
            sm:hidden
          "
          onClick={open}
        >
          <Icon name={I.MENU} class="text-xl" />
        </button>

        {/* 遮罩层 */}
        {isOpen.value && (
          <div
            class="
              fixed
              inset-0 z-120 bg-black/50
              transition-opacity
              duration-300 sm:hidden
            "
            style={{ opacity: isOpen.value ? 1 : 0 }}
            onClick={close}
          />
        )}

        {/* 抽屉 */}
        <div
          class="
            border-base-content/5
            bg-base-100/80 fixed
            top-0
            bottom-0 left-0
            z-130 flex
            w-[70vw]
            flex-col
            border-r
            px-4
            pt-4
            pb-4
            shadow-2xl
            backdrop-blur-sm
            transition-transform duration-300 ease-out
            sm:hidden
          "
          style={{
            transform: isOpen.value ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {slots.default?.()}
          <div class="mt-auto flex flex-col gap-4">
            <ThemeToggle />
            <Links>
              {slots.left?.()}
            </Links>
          </div>
        </div>
      </>
    )
  },
})

export default MobileSider
