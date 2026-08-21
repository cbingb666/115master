import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import {
  computed,
  defineComponent,
  onBeforeUnmount,
  shallowRef,
  Transition,
  watch,
} from 'vue'
import { Pill } from '../Pill/Pill'

export type FloatingDockContentKey = string | number

const props = {
  contentKey: {
    type: [String, Number] as PropType<FloatingDockContentKey | null>,
    default: null,
  },
} as const

export type FloatingDockProps = ExtractPublicPropTypes<typeof props>

/**
 * A continuous Floating Glass surface for bottom-of-page controls whose
 * content can appear, disappear, or change size. The page owns placement and
 * any backdrop behind the dock.
 */
export const FloatingDock = defineComponent({
  name: 'FloatingDock',

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    const content = shallowRef<HTMLElement>()
    const size = shallowRef<{ height: number, width: number }>()
    let observer: ResizeObserver | undefined

    watch(content, (element) => {
      observer?.disconnect()
      observer = undefined

      if (!element || typeof ResizeObserver === 'undefined')
        return

      observer = new ResizeObserver(([entry]) => {
        const target = entry.target as HTMLElement
        size.value = {
          height: target.offsetHeight,
          width: target.offsetWidth,
        }
      })
      observer.observe(element)
    }, { flush: 'post' })

    onBeforeUnmount(() => observer?.disconnect())

    const style = computed(() => size.value
      ? {
          height: `${size.value.height}px`,
          width: `${size.value.width}px`,
        }
      : undefined)

    return () => (
      <Transition name="ui-floating-dock">
        {props.contentKey !== null && (
          <Pill
            key="surface"
            as="div"
            variant="glass-floating"
            size="md"
            class="ui-floating-dock pointer-events-auto box-content grid min-h-0 grid-cols-1 overflow-hidden p-0"
            style={style.value}
            data-ui-floating-dock=""
          >
            <Transition name="ui-floating-dock-content">
              <div
                ref={content}
                key={props.contentKey}
                class="ui-floating-dock__content col-start-1 row-start-1 justify-self-center"
                data-ui-floating-dock-content=""
              >
                {slots.default?.()}
              </div>
            </Transition>
          </Pill>
        )}
      </Transition>
    )
  },
})
