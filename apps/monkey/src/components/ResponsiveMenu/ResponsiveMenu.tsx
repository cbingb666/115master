import type { SlotsType, VNode } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { defineComponent } from 'vue'
import { useDialog } from '@/components'

const Dropdown = defineComponent({
  name: 'Dropdown',
  slots: Object as SlotsType<{
    target: () => void
    default: () => void
  }>,
  setup: (_, { slots }) => {
    return () => (
      <div class="dropdown dropdown-end">
        {slots.target?.()}
        <div
          class="
            dropdown-content menu
            rounded-box
            bg-base-300/30
            ring-base-300/10 ring-1 backdrop-blur-2xl
            backdrop-brightness-30 backdrop-saturate-180
          "
        >
          {slots.default?.()}
        </div>
      </div>
    )
  },
})

const PullupModalProps = {
  title: {
    type: String,
    default: '请选择',
  },
}

const PullupModal = defineComponent({
  name: 'PullupModal',
  props: PullupModalProps,
  slots: Object as SlotsType<{
    default: () => VNode
    target: (props: { onClick: () => void }) => VNode
  }>,
  setup: (props, { slots }) => {
    const TargetSlot = slots.target
    const DefaultSlot = slots.default

    const dialog = useDialog()

    const handleClick = () => {
      (document.activeElement as HTMLElement)?.blur()
      dialog.create({
        title: props.title,
        showConfirm: false,

        content: () => (
          <ul
            class="menu w-full text-right"
          >
            <DefaultSlot />
          </ul>
        ),
      })
    }

    return () => (
      <>
        <TargetSlot
          onClick={handleClick}
        />
      </>
    )
  },
})

const ResponsiveMenu = defineComponent({
  name: 'ResponsiveMenu',
  props: {
    ...PullupModalProps,
  },
  slots: Object as SlotsType<{
    default: () => void
    target: () => void
  }>,
  setup: (props, { slots }) => {
    const breakpoints = useBreakpoints(breakpointsTailwind)
    const largerThanSm = breakpoints.greater('sm')
    return () => (
      <>
        {largerThanSm.value
          ? (
              <Dropdown>
                {{
                  target: slots.target,
                  default: slots.default,
                }}
              </Dropdown>
            )
          : (
              <PullupModal title={props.title}>
                {{
                  target: slots.target,
                  default: slots.default,
                }}
              </PullupModal>
            )}
      </>
    )
  },
})

export default ResponsiveMenu
