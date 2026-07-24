import type { SlotsType, VNode } from 'vue'
import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'
import { defineComponent, nextTick, onBeforeUnmount, shallowRef, Teleport, watch } from 'vue'
import { useDialog } from '@/components'

type Slot = VNode
interface Trigger {
  onClick: () => void
}

const Dropdown = defineComponent({
  name: 'Dropdown',
  slots: Object as SlotsType<{
    target: (props: Trigger) => Slot
    default: () => Slot
  }>,
  setup: (_, { slots }) => {
    const anchor = shallowRef<HTMLElement>()
    const menu = shallowRef<HTMLElement>()
    const open = shallowRef(false)
    const pos = shallowRef({ x: 0, y: 0 })

    const place = () => {
      if (!anchor.value)
        return
      const rect = anchor.value.getBoundingClientRect()
      const box = menu.value?.getBoundingClientRect()
      const w = box?.width ?? 0
      const h = box?.height ?? 0
      const gap = 8
      let x = rect.right - w
      let y = rect.bottom + gap
      if (x + w > window.innerWidth - 10)
        x = window.innerWidth - w - 10
      if (x < 10)
        x = 10
      if (y + h > window.innerHeight - 10)
        y = rect.top - h - gap
      if (y < 10)
        y = 10
      pos.value = { x, y }
    }

    const show = () => {
      open.value = true
      nextTick(place)
    }

    const hide = () => {
      open.value = false
    }

    const toggle = () => {
      if (open.value) {
        hide()
        return
      }
      show()
    }

    const out = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target)
        return
      if (anchor.value?.contains(target))
        return
      if (menu.value?.contains(target))
        return
      hide()
    }

    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape')
        return
      hide()
    }

    const tap = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target)
        return
      if (!target.closest('a,button,input,label,[role="menuitem"]'))
        return
      requestAnimationFrame(() => hide())
    }

    const bind = () => {
      document.addEventListener('pointerdown', out)
      document.addEventListener('keydown', key)
      window.addEventListener('resize', place)
      window.addEventListener('scroll', place, true)
    }

    const clear = () => {
      document.removeEventListener('pointerdown', out)
      document.removeEventListener('keydown', key)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }

    watch(open, (value) => {
      if (value) {
        bind()
        return
      }
      clear()
    })

    onBeforeUnmount(clear)

    return () => (
      <>
        <div ref={anchor} class="inline-flex">
          {slots.target?.({ onClick: toggle })}
        </div>
        <Teleport to="#my-app">
          {open.value && (
            <div
              ref={menu}
              class="
                menu
                app-glass-floating
                fixed
                top-0
                left-0
                z-10000
                rounded-3xl
              "
              style={{ left: `${pos.value.x}px`, top: `${pos.value.y}px` }}
              onClick={tap}
            >
              {slots.default?.()}
            </div>
          )}
        </Teleport>
      </>
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
    default: () => Slot
    target: (props: Trigger) => Slot
  }>,
  setup: (props, { slots }) => {
    const TargetSlot = slots.target
    const DefaultSlot = slots.default

    const dialog = useDialog()

    const handleClick = () => {
      (document.activeElement as HTMLElement)?.blur()
      const instance = dialog.create({
        title: props.title,
        showConfirm: false,

        content: () => (
          <ul
            class="menu w-full text-right"
            onClick={(event) => {
              const target = event.target as HTMLElement | null
              if (!target?.closest('a,button,input,label,[role="menuitem"]'))
                return
              requestAnimationFrame(() => instance.hide())
            }}
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
    default: () => Slot
    target: (props: Trigger) => Slot
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
