import type { MaybeElement } from '@vueuse/core'
import type { PropType } from 'vue'
import {
  defineComponent,
  nextTick,
  onBeforeUnmount,
  shallowRef,
  Teleport,
  Transition,
  watch,
  withModifiers,
} from 'vue'

function findScrollParent(x: number, y: number): HTMLElement {
  const el = document.elementFromPoint(x, y)
  if (!el)
    return document.documentElement
  let current = el as HTMLElement | null
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current)
    if (/auto|scroll/.test(style.overflowY) && current.scrollHeight > current.clientHeight)
      return current
    current = current.parentElement
  }
  return document.documentElement
}

const ContextMenu = defineComponent({
  name: 'ContextMenu',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Object as PropType<{ x: number, y: number }>,
      default: () => ({ x: 0, y: 0 }),
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  setup: (props, { slots }) => {
    const menuRef = shallowRef<MaybeElement>()
    const adjustedPosition = shallowRef({ x: 0, y: 0 })
    let lockedEl: HTMLElement | null = null
    let prevOverflow = ''

    function lockScroll() {
      lockedEl = findScrollParent(props.position.x, props.position.y)
      if (lockedEl) {
        prevOverflow = lockedEl.style.overflowY
        lockedEl.style.overflowY = 'hidden'
      }
    }

    function unlockScroll() {
      if (lockedEl) {
        lockedEl.style.overflowY = prevOverflow
        lockedEl = null
      }
    }

    onBeforeUnmount(unlockScroll)

    const calculatePosition = async () => {
      if (!menuRef.value)
        return
      await nextTick()
      const menuElement = menuRef.value as HTMLElement
      const rect = menuElement.getBoundingClientRect()
      const menuWidth = rect.width
      const menuHeight = rect.height
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      let x = props.position.x
      let y = props.position.y
      if (x + menuWidth > viewportWidth)
        x = viewportWidth - menuWidth - 10
      if (x < 10)
        x = 10
      if (y + menuHeight > viewportHeight)
        y = viewportHeight - menuHeight - 10
      if (y < 10)
        y = 10
      adjustedPosition.value = { x, y }
    }

    watch(() => props.show, (value) => {
      if (value) {
        lockScroll()
        adjustedPosition.value = { x: props.position.x, y: props.position.y }
        nextTick(() => calculatePosition())
      }
      else {
        unlockScroll()
      }
    })

    watch(() => props.position, () => {
      if (props.show) {
        adjustedPosition.value = { x: props.position.x, y: props.position.y }
        nextTick(() => calculatePosition())
      }
    }, { deep: true })

    return () => (
      <>
        <Teleport to="#my-app">
          {props.show && (
            <div
              class="fixed inset-0 z-10000 cursor-pointer"
              onClick={withModifiers(() => props.onClose?.(), ['self', 'stop'])}
              onContextmenu={withModifiers(() => props.onClose?.(), ['prevent'])}
            />
          )}
          <Transition
            enterActiveClass="duration-100 ease-out"
            enterFromClass="opacity-0 scale-95"
            enterToClass="opacity-100 scale-100"
            leaveActiveClass="duration-150 ease-in"
            leaveFromClass="opacity-100 scale-100"
            leaveToClass="opacity-0 scale-95"
          >
            {props.show && (
              <div
                ref={menuRef}
                class="
                  menu
                  bg-base-200/70 liquid-glass shadow-base-100/70
                  fixed top-0 left-0 z-10000 rounded-xl shadow-xl
                  before:rounded-xl before:backdrop-blur-xl after:rounded-xl
                "
                style={{ left: `${adjustedPosition.value.x}px`, top: `${adjustedPosition.value.y}px` }}
              >
                {slots.default?.()}
              </div>
            )}
          </Transition>
        </Teleport>
      </>
    )
  },
})

export default ContextMenu
