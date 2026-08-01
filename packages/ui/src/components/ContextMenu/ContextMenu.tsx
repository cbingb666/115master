import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import {
  computed,
  defineComponent,
  inject,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  Teleport,
  Transition,
  watch,
} from 'vue'
import { overlayHostKey } from '../OverlayHost/context'

export interface ContextMenuPosition {
  x: number
  y: number
}

export type ContextMenuTarget = HTMLElement | string
export type ContextMenuCloseReason = 'escape' | 'backdrop'

const itemSelector
  = ':is([role^="menuitem"], li > a, li > button):not(:disabled):not([aria-disabled="true"])'

const props = {
  open: {
    type: Boolean,
    default: false,
  },
  position: {
    type: Object as PropType<ContextMenuPosition>,
    default: () => ({ x: 0, y: 0 }),
  },
  to: {
    type: [String, Object] as PropType<ContextMenuTarget>,
    default: undefined,
  },
} as const

export type ContextMenuProps = ExtractPublicPropTypes<typeof props>

function scrollParent(x: number, y: number) {
  const element = document.elementFromPoint(x, y)

  if (!element)
    return document.documentElement

  let current = element as HTMLElement | null
  while (current && current !== document.documentElement) {
    const style = getComputedStyle(current)

    if (/auto|scroll/.test(style.overflowY) && current.scrollHeight > current.clientHeight)
      return current
    current = current.parentElement
  }
  return document.documentElement
}

/**
 * A controlled, Theme-scoped context-menu surface. Applications provide menu
 * items through the default slot while positioning, collision handling,
 * dismissal, scroll locking and keyboard focus stay inside this module.
 */
export const ContextMenu = defineComponent({
  name: 'ContextMenu',

  inheritAttrs: false,

  props,

  emits: {
    'update:open': (_open: boolean) => true,
    'close': (_reason: ContextMenuCloseReason) => true,
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { attrs, emit, slots }) {
    const menu = shallowRef<HTMLElement>()
    const adjusted = shallowRef<ContextMenuPosition>({ x: 0, y: 0 })
    const mounted = shallowRef(false)
    const host = inject(overlayHostKey, undefined)
    const target = computed(() => {
      if (props.to)
        return props.to
      if (host?.value)
        return host.value
      if (mounted.value)
        return document.body
      return undefined
    })
    let locked: HTMLElement | undefined
    let overflow = ''
    let previous: HTMLElement | undefined

    function unlock() {
      if (!locked)
        return
      locked.style.overflowY = overflow
      locked = undefined
    }

    function deactivate() {
      unlock()
      if (previous && document.contains(previous))
        previous.focus()
      previous = undefined
    }

    function calculate() {
      if (!menu.value)
        return
      const rect = menu.value.getBoundingClientRect()
      let x = props.position.x
      let y = props.position.y

      if (x + rect.width > window.innerWidth)
        x = window.innerWidth - rect.width - 10
      if (x < 10)
        x = 10
      if (y + rect.height > window.innerHeight)
        y = window.innerHeight - rect.height - 10
      if (y < 10)
        y = 10
      adjusted.value = { x, y }
    }

    function activate() {
      previous = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : undefined
      locked = scrollParent(props.position.x, props.position.y)
      overflow = locked.style.overflowY
      locked.style.overflowY = 'hidden'
      adjusted.value = { ...props.position }
      nextTick(() => {
        if (!props.open)
          return
        calculate()
        menu.value?.focus()
      })
    }

    function close(reason: ContextMenuCloseReason) {
      emit('update:open', false)
      emit('close', reason)
    }

    function items() {
      if (!menu.value)
        return []
      return [...menu.value.querySelectorAll<HTMLElement>(itemSelector)]
    }

    function focus(delta: number) {
      const available = items()

      if (available.length === 0)
        return
      const index = available.indexOf(document.activeElement as HTMLElement)
      const next = index === -1
        ? (delta > 0 ? 0 : available.length - 1)
        : (index + delta + available.length) % available.length

      available[next]?.focus()
    }

    function menuKeydown(event: KeyboardEvent) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        focus(1)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        focus(-1)
        return
      }
      if (event.key === 'Home') {
        event.preventDefault()
        items()[0]?.focus()
        return
      }
      if (event.key === 'End') {
        event.preventDefault()
        const available = items()

        available[available.length - 1]?.focus()
        return
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        focus(event.shiftKey ? -1 : 1)
      }
    }

    function keydown(event: KeyboardEvent) {
      if (event.key !== 'Escape' || !props.open)
        return
      event.preventDefault()
      event.stopPropagation()
      close('escape')
    }

    function backdrop(event: MouseEvent) {
      event.preventDefault()
      event.stopPropagation()
      close('backdrop')
    }

    watch(() => props.open, (open) => {
      if (!mounted.value)
        return
      if (open) {
        activate()
        return
      }
      deactivate()
    })
    watch(() => props.position, () => {
      if (!props.open)
        return
      adjusted.value = { ...props.position }
      nextTick(calculate)
    }, { deep: true })
    onMounted(() => {
      mounted.value = true
      window.addEventListener('keydown', keydown, true)
      if (props.open)
        activate()
    })
    onBeforeUnmount(() => {
      window.removeEventListener('keydown', keydown, true)
      deactivate()
    })

    return () => target.value && (
      <Teleport to={target.value}>
        {props.open && (
          <div
            class="ui-context-menu-backdrop ui-z-menu fixed inset-0 cursor-pointer"
            data-ui-context-menu-backdrop=""
            onClick={backdrop}
            onContextmenu={backdrop}
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
          {props.open && (
            <div
              {...mergeProps(attrs, {
                'ref': menu,
                'role': 'menu',
                'tabindex': -1,
                'class': [
                  'ui-context-menu',
                  'menu',
                  'ui-glass-floating',
                  'ui-z-menu',
                  'fixed',
                  'top-0',
                  'left-0',
                  'min-w-44',
                  'rounded-2xl',
                  'p-1.5',
                  'outline-none',
                ],
                'style': {
                  left: `${adjusted.value.x}px`,
                  top: `${adjusted.value.y}px`,
                },
                'data-ui-context-menu': '',
                'onKeydown': menuKeydown,
              })}
            >
              {slots.default?.()}
            </div>
          )}
        </Transition>
      </Teleport>
    )
  },
})
