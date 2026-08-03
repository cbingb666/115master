import type { SlotsType } from 'vue'
import { Button, Drawer, scrollbar } from '@115master/ui'
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
    const waiters: Array<() => void> = []
    const open = () => isOpen.value = true
    const close = () => isOpen.value = false

    function prepare() {
      if (!isOpen.value)
        return Promise.resolve()

      return new Promise<void>((resolve) => {
        waiters.push(resolve)
        close()
      })
    }

    function closed() {
      waiters.splice(0).forEach(resolve => resolve())
    }

    const route = useRoute()
    watch(() => route.fullPath, close)

    return () => (
      <>
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

        <Drawer
          open={isOpen.value}
          label="导航菜单"
          placement="bottom"
          size="lg"
          class="sm:hidden"
          style="--ui-drawer-size: min(80dvh, 44rem)"
          onUpdate:open={value => isOpen.value = value}
          onClosed={closed}
        >
          <div
            data-ui-mobile-sider
            class={[
              ...scrollbar(),
              'flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4',
            ]}
          >
            {slots.default?.()}
            <div class="mt-auto flex flex-col gap-4">
              {slots.left?.()}
              <SiderMenuButton beforeOpen={prepare} />
            </div>
          </div>
        </Drawer>
      </>
    )
  },
})

export default MobileSider
