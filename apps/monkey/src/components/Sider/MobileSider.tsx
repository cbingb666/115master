import type { SlotsType } from 'vue'
import { Button, scrollbar } from '@115master/ui'
import { defineComponent, ref, shallowRef, watch } from 'vue'
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
    const panel = shallowRef<HTMLElement>()
    const open = () => isOpen.value = true
    const close = () => isOpen.value = false

    function settled(element: HTMLElement) {
      return new Promise<void>((resolve) => {
        let timer: ReturnType<typeof setTimeout>

        function finish() {
          clearTimeout(timer)
          element.removeEventListener('transitionend', transitioned)
          resolve()
        }

        function transitioned(event: TransitionEvent) {
          if (event.target !== element || event.propertyName !== 'transform')
            return

          finish()
        }

        element.addEventListener('transitionend', transitioned)
        timer = setTimeout(finish, 350)
      })
    }

    async function prepare() {
      const element = panel.value
      const transition = element ? settled(element) : Promise.resolve()
      close()
      await transition
      document.querySelector<HTMLElement>('[data-ui-mobile-sider-trigger]')?.focus({ preventScroll: true })
    }

    const route = useRoute()
    watch(() => route.fullPath, close)

    return () => (
      <>
        {/* 汉堡按钮 */}
        <Button
          color="primary"
          size="lg"
          shape="circle"
          aria-label="打开菜单"
          data-ui-mobile-sider-trigger
          class="ui-z-fab fixed right-4 bottom-4 shadow-lg sm:hidden"
          onClick={open}
        >
          <Icon name={I.MENU} class="text-xl" />
        </Button>

        {/* 遮罩层 */}
        {isOpen.value && (
          <div
            class="
              ui-z-scrim
              fixed inset-0 bg-black/50
              transition-opacity duration-300
              ease-[var(--ui-ease-standard)] sm:hidden
            "
            style={{ opacity: isOpen.value ? 1 : 0 }}
            onClick={close}
          />
        )}

        {/* 底部弹出层 */}
        <div
          ref={panel}
          data-ui-mobile-sider
          class={[
            ...scrollbar(),
            `ui-glass-panel
              ui-z-sheet
              fixed inset-x-0
              bottom-0 flex
              max-h-[80dvh]
              flex-col
              overflow-y-auto
              rounded-t-2xl
              px-4
              pb-4
              transition-transform duration-300 ease-[var(--ui-ease-move)]
              sm:hidden`,
          ]}
          style={{
            transform: isOpen.value ? 'translateY(0)' : 'translateY(100%)',
          }}
        >
          <div class="bg-base-content/20 mx-auto mt-2 mb-1 h-1 w-10 flex-none rounded-full" />
          {slots.default?.()}
          <div class="mt-auto flex flex-col gap-4">
            {slots.left?.()}
            <SiderMenuButton beforeOpen={prepare} />
          </div>
        </div>
      </>
    )
  },
})

export default MobileSider
