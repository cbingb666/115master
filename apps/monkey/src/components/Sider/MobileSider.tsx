import type { SlotsType } from 'vue'
import { defineComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { I, Icon } from '@/icons'
import SiderMenuButton from './SiderMenuButton'

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

    const route = useRoute()
    watch(() => route.fullPath, close)

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

        {/* 底部弹出层 */}
        <div
          class="
            border-base-content/10
            bg-base-100/85 fixed
            inset-x-0 bottom-0
            z-130 flex
            max-h-[80dvh]
            flex-col
            overflow-y-auto
            rounded-t-2xl
            border-t
            px-4
            pb-4
            shadow-2xl
            backdrop-blur-sm
            transition-transform duration-300 ease-out
            sm:hidden
          "
          style={{
            transform: isOpen.value ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          <div class="bg-base-content/20 mx-auto mt-2 mb-1 h-1 w-10 flex-none rounded-full" />
          {slots.default?.()}
          <div class="mt-auto flex flex-col gap-4">
            {slots.left?.()}
            <SiderMenuButton />
          </div>
        </div>
      </>
    )
  },
})

export default MobileSider
