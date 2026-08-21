import type {
  ExtractPublicPropTypes,
  SlotsType,
  VNodeChild,
} from 'vue'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import {
  computed,
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  Teleport,
  Transition,
  useId,
  watch,
} from 'vue'
import { Drawer } from '../Drawer/Drawer'
import { overlayHostKey } from '../OverlayHost/context'

export interface ResponsiveMenuTrigger {
  'aria-controls': string
  'aria-expanded': boolean
  'aria-haspopup': 'dialog' | 'menu'
  'aria-label': string
  'onClick': () => void
}

const props = {
  title: {
    type: String,
    required: true,
  },
} as const

export type ResponsiveMenuProps = ExtractPublicPropTypes<typeof props>

const desktopQuery = '(min-width: 40rem)'
const itemSelector
  = ':is(a, button, input, summary, [role^="menuitem"]):not(:disabled):not([aria-disabled="true"])'
const actionSelector
  = ':is(a, button, input, label, [role^="menuitem"]):not(:disabled):not([aria-disabled="true"])'

/**
 * An anchored action menu that uses a floating surface on desktop and a
 * bottom Drawer on compact viewports. The caller owns the trigger and items;
 * hosting, positioning, dismissal and focus stay inside this module.
 */
export const ResponsiveMenu = defineComponent({
  name: 'ResponsiveMenu',

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    target: (trigger: ResponsiveMenuTrigger) => VNodeChild
  }>,

  setup(props, { slots }) {
    const anchor = shallowRef<HTMLElement>()
    const menu = shallowRef<HTMLElement>()
    const open = shallowRef(false)
    const mounted = shallowRef(false)
    const desktop = shallowRef(globalThis.matchMedia?.(desktopQuery).matches ?? true)
    const host = inject(overlayHostKey, undefined)
    const id = `ui-responsive-menu-${useId()}`
    const target = computed(() => {
      const modal = anchor.value?.closest<HTMLElement>('[data-ui-modal-root]')

      if (modal)
        return modal
      if (host?.value)
        return host.value
      if (mounted.value)
        return document.body
      return undefined
    })
    const middleware = computed(() => [
      offset(8),
      flip({ padding: 10 }),
      shift({ padding: 10 }),
    ])
    const { floatingStyles } = useFloating(anchor, menu, {
      open,
      placement: 'bottom-end',
      strategy: 'fixed',
      middleware,
      whileElementsMounted: autoUpdate,
    })
    let media: MediaQueryList | undefined
    let previous: HTMLElement | undefined

    function close() {
      open.value = false
    }

    function toggle() {
      open.value = !open.value
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
      if (event.key !== 'Escape' || !open.value || !desktop.value)
        return
      event.preventDefault()
      event.stopPropagation()
      close()
    }

    function mode(event: MediaQueryListEvent) {
      desktop.value = event.matches
    }

    function select(event: MouseEvent) {
      if (!(event.target instanceof Element) || !event.target.closest(actionSelector))
        return
      requestAnimationFrame(close)
    }

    function trigger(): ResponsiveMenuTrigger {
      return {
        'aria-controls': id,
        'aria-expanded': open.value,
        'aria-haspopup': desktop.value ? 'menu' : 'dialog',
        'aria-label': props.title,
        'onClick': toggle,
      }
    }

    watch(open, (visible) => {
      if (visible) {
        if (!desktop.value)
          return
        previous = document.activeElement instanceof HTMLElement
          ? document.activeElement
          : undefined
        document.addEventListener('keydown', keydown, true)
        void nextTick(() => menu.value?.focus())
        return
      }
      document.removeEventListener('keydown', keydown, true)
      if (previous?.isConnected)
        previous.focus({ preventScroll: true })
      previous = undefined
    })
    watch(desktop, () => {
      if (open.value)
        close()
    })

    onMounted(() => {
      mounted.value = true
      media = window.matchMedia(desktopQuery)
      desktop.value = media.matches
      media.addEventListener('change', mode)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('keydown', keydown, true)
      media?.removeEventListener('change', mode)
      media = undefined
    })

    return () => (
      <>
        <span ref={anchor} class="inline-flex" data-ui-responsive-menu-trigger="">
          {slots.target(trigger())}
        </span>

        {desktop.value
          ? target.value && (
            <Teleport to={target.value}>
              {open.value && (
                <div
                  class="ui-responsive-menu__backdrop ui-z-menu fixed inset-0"
                  data-ui-responsive-menu-backdrop=""
                  onPointerdown={close}
                  onContextmenu={(event) => {
                    event.preventDefault()
                    close()
                  }}
                />
              )}
              <Transition
                enterActiveClass="duration-100 ease-[var(--ui-ease-enter)]"
                enterFromClass="opacity-0 scale-95"
                enterToClass="opacity-100 scale-100"
                leaveActiveClass="duration-150 ease-[var(--ui-ease-exit)]"
                leaveFromClass="opacity-100 scale-100"
                leaveToClass="opacity-0 scale-95"
              >
                {open.value && (
                  <ul
                    ref={menu}
                    id={id}
                    aria-label={props.title}
                    class="
                        ui-responsive-menu__dropdown
                        menu
                        ui-glass-floating
                        ui-z-menu
                        min-w-44
                        rounded-2xl
                        p-1.5
                        outline-none
                      "
                    data-ui-responsive-menu="dropdown"
                    role="menu"
                    tabindex={-1}
                    style={floatingStyles.value}
                    onClick={select}
                    onKeydown={menuKeydown}
                  >
                    {slots.default?.()}
                  </ul>
                )}
              </Transition>
            </Teleport>
          )
          : (
              <Drawer
                open={open.value}
                label={props.title}
                placement="bottom"
                size="sm"
                class="ui-responsive-menu__drawer"
                data-ui-responsive-menu="drawer"
                onUpdate:open={value => open.value = value}
              >
                <section class="ui-responsive-menu__sheet">
                  <h2 class="ui-responsive-menu__title">{props.title}</h2>
                  <ul
                    id={id}
                    aria-label={props.title}
                    class="ui-responsive-menu__items menu"
                    role="menu"
                    onClick={select}
                  >
                    {slots.default?.()}
                  </ul>
                </section>
              </Drawer>
            )}
      </>
    )
  },
})
