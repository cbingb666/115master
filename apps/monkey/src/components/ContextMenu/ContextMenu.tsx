import type { MaybeElement } from '@vueuse/core'
import type { PropType } from 'vue'
import { useEventListener } from '@vueuse/core'
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

/** 可聚焦菜单项选择器 */
const MENU_ITEM_SELECTOR
  = 'li > :is(a, button, [role="menuitem"]):not(:disabled):not([aria-disabled="true"])'

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
    let prevFocus: HTMLElement | null = null

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

    function getMenuItems(): HTMLElement[] {
      const el = menuRef.value as HTMLElement | undefined
      if (!el)
        return []
      return Array.from(el.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR))
    }

    /** 方向键 / Tab 在菜单项间循环聚焦 */
    function focusItem(delta: number) {
      const items = getMenuItems()
      if (items.length === 0)
        return
      const index = items.indexOf(document.activeElement as HTMLElement)
      const next = index === -1
        ? (delta > 0 ? 0 : items.length - 1)
        : (index + delta + items.length) % items.length
      items[next].focus()
    }

    function onMenuKeydown(event: KeyboardEvent) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          focusItem(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          focusItem(-1)
          break
        case 'Home':
          event.preventDefault()
          getMenuItems()[0]?.focus()
          break
        case 'End':
          event.preventDefault()
          getMenuItems().slice(-1)[0]?.focus()
          break
        case 'Tab':
          // 菜单开启期间焦点保持在菜单内循环
          event.preventDefault()
          focusItem(event.shiftKey ? -1 : 1)
          break
      }
    }

    /**
     * Esc 关闭：capture 阶段拦截并阻止传播，
     * 避免穿透到页面级监听（如 useListSelection 的清空选中）
     */
    useEventListener(window, 'keydown', (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !props.show)
        return
      event.preventDefault()
      event.stopPropagation()
      props.onClose?.()
    }, { capture: true })

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
        prevFocus = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
        lockScroll()
        adjustedPosition.value = { x: props.position.x, y: props.position.y }
        nextTick(() => {
          calculatePosition()
          // 焦点移入菜单，保证 Esc / 方向键立即可用
          ;(menuRef.value as HTMLElement | undefined)?.focus()
        })
      }
      else {
        unlockScroll()
        if (prevFocus && document.contains(prevFocus))
          prevFocus.focus()
        prevFocus = null
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
              class="ui-z-menu fixed inset-0 cursor-pointer"
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
                role="menu"
                tabindex={-1}
                onKeydown={onMenuKeydown}
                class="
                  menu
                  ui-glass-floating
                  ui-z-menu
                  fixed
                  top-0
                  left-0
                  min-w-44
                  rounded-2xl
                  p-1.5
                  outline-none
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
