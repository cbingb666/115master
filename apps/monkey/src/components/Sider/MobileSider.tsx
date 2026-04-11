import type { SlotsType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent, ref } from 'vue'
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
            sm:hidden
            fixed bottom-4 right-4 z-110
            h-12 w-12
            flex items-center justify-center
            rounded-full
            bg-primary text-primary-content
            shadow-lg
            transition-transform
            hover:scale-105
            active:scale-95
          "
          onClick={open}
        >
          <Icon icon="lucide:menu" class="text-xl" />
        </button>

        {/* 遮罩层 */}
        {isOpen.value && (
          <div
            class="
              sm:hidden
              fixed inset-0 z-120
              bg-black/50
              transition-opacity duration-300
            "
            style={{ opacity: isOpen.value ? 1 : 0 }}
            onClick={close}
          />
        )}

        {/* 抽屉 */}
        <div
          class="
            sm:hidden
            border-base-content/5 bg-base-100/80
            fixed
            top-0 bottom-0
            left-0 z-130
            flex
            w-[70vw]
            flex-col
            border-r
            px-4
            pt-4
            pb-4
            shadow-2xl
            transition-transform duration-300 ease-out
            backdrop-blur-sm
          "
          style={{
            transform: isOpen.value ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          {slots.default?.()}
          <Links>
            {slots.left?.()}
          </Links>
        </div>
      </>
    )
  },
})

export default MobileSider
