import type {
  ComponentPublicInstance,
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNode,
  VNodeChild,
} from 'vue'
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import {
  cloneVNode,
  computed,
  defineComponent,
  inject,
  isVNode,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  Teleport,
  useId,
  watch,
} from 'vue'
import { filled } from '../content'
import { overlayHostKey } from '../OverlayHost/context'

export type TooltipPlacement = 'top' | 'right' | 'bottom' | 'left'
export type TooltipTarget = HTMLElement | string

const props = {
  content: {
    type: String,
    default: '',
  },
  placement: {
    type: String as PropType<TooltipPlacement>,
    default: 'bottom',
  },
  openDelay: {
    type: Number,
    default: 400,
  },
  closeDelay: {
    type: Number,
    default: 100,
  },
  to: {
    type: [String, Object] as PropType<TooltipTarget>,
    default: undefined,
  },
} as const

export type TooltipProps = ExtractPublicPropTypes<typeof props>

const placementClasses: Record<TooltipPlacement, string> = {
  top: 'tooltip-top',
  right: 'tooltip-right',
  bottom: 'tooltip-bottom',
  left: 'tooltip-left',
}

function side(value: string): TooltipPlacement {
  if (value === 'top' || value === 'right' || value === 'bottom' || value === 'left')
    return value
  return 'bottom'
}

/**
 * Non-interactive supplemental text for one anchor. The default slot should
 * contain one element so the ARIA description and focus events reach it.
 */
export const Tooltip = defineComponent({
  name: 'Tooltip',

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    content?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    const reference = shallowRef<HTMLElement>()
    const floating = shallowRef<HTMLElement>()
    const visible = shallowRef(false)
    const mounted = shallowRef(false)
    const host = inject(overlayHostKey, undefined)
    const id = `ui-tooltip-${useId()}`
    const contents = computed(() => {
      const nodes = slots.content?.()

      if (filled(nodes))
        return nodes
      return props.content.trim() || undefined
    })
    const content = computed(() => contents.value !== undefined)
    const target = computed(() => {
      if (props.to)
        return props.to
      if (host?.value)
        return host.value
      if (!mounted.value)
        return undefined
      return document.body
    })
    const middleware = computed(() => [
      offset(8),
      flip(),
      shift({ padding: 8 }),
    ])
    const preferred = computed(() => props.placement)
    const { floatingStyles, placement } = useFloating(reference, floating, {
      open: visible,
      placement: preferred,
      strategy: 'fixed',
      middleware,
      whileElementsMounted: autoUpdate,
    })
    let opening: ReturnType<typeof setTimeout> | undefined
    let closing: ReturnType<typeof setTimeout> | undefined
    let listening = false

    function cancelOpen() {
      if (opening === undefined)
        return
      clearTimeout(opening)
      opening = undefined
    }

    function cancelClose() {
      if (closing === undefined)
        return
      clearTimeout(closing)
      closing = undefined
    }

    function duration(value: number) {
      return Math.max(0, value)
    }

    function show() {
      if (!content.value)
        return
      cancelOpen()
      cancelClose()
      visible.value = true
    }

    function showLater() {
      if (!content.value)
        return
      cancelClose()
      cancelOpen()
      opening = setTimeout(() => {
        opening = undefined
        visible.value = true
      }, duration(props.openDelay))
    }

    function hide() {
      cancelOpen()
      cancelClose()
      visible.value = false
    }

    function hideLater() {
      cancelOpen()
      if (!visible.value)
        return
      cancelClose()
      closing = setTimeout(() => {
        closing = undefined
        visible.value = false
      }, duration(props.closeDelay))
    }

    function keydown(event: KeyboardEvent) {
      if (event.key !== 'Escape')
        return
      hide()
      event.stopPropagation()
    }

    function listen() {
      if (listening)
        return
      document.addEventListener('keydown', keydown, true)
      listening = true
    }

    function unlisten() {
      if (!listening)
        return
      document.removeEventListener('keydown', keydown, true)
      listening = false
    }

    function setReference(value: Element | ComponentPublicInstance | null) {
      if (value instanceof HTMLElement) {
        reference.value = value
        return
      }
      if (!value || value instanceof Element) {
        reference.value = undefined
        return
      }
      const element = value.$el
      reference.value = element instanceof HTMLElement ? element : undefined
    }

    function description(node?: VNode) {
      const value = node?.props?.['aria-describedby']
      const previous = typeof value === 'string' ? value : ''
      if (!visible.value || !content.value)
        return previous || undefined
      return [previous, id].filter(Boolean).join(' ')
    }

    function trigger() {
      const nodes = slots.default?.()
      if (!nodes)
        return null

      const attrs = {
        ref: setReference,
        onMouseenter: showLater,
        onMouseleave: hideLater,
        onFocusin: show,
        onFocusout: hide,
      }
      const first = Array.isArray(nodes) && nodes.length === 1 ? nodes[0] : undefined
      if (!first || !isVNode(first) || typeof first.type === 'symbol') {
        return (
          <span {...attrs} aria-describedby={description()}>
            {nodes}
          </span>
        )
      }

      return cloneVNode(first, {
        ...attrs,
        'aria-describedby': description(first),
      }, true)
    }

    watch(content, (value) => {
      if (!value)
        hide()
    })
    watch(visible, (value) => {
      if (!mounted.value)
        return
      if (value) {
        listen()
        return
      }
      unlisten()
    })
    onMounted(() => {
      mounted.value = true
      if (visible.value)
        listen()
    })
    onBeforeUnmount(() => {
      cancelOpen()
      cancelClose()
      unlisten()
    })

    return () => {
      const actual = side(placement.value)

      return (
        <>
          {trigger()}
          {visible.value && content.value && target.value && (
            <Teleport to={target.value}>
              <div
                ref={floating}
                class={[
                  'ui-tooltip',
                  'tooltip',
                  'tooltip-open',
                  'pointer-events-none',
                  'ui-z-tooltip',
                  placementClasses[actual],
                ]}
                data-ui-placement={placement.value}
                data-ui-tooltip=""
                id={id}
                role="tooltip"
                style={floatingStyles.value}
              >
                <div class="tooltip-content">
                  {contents.value}
                </div>
              </div>
            </Teleport>
          )}
        </>
      )
    }
  },
})
