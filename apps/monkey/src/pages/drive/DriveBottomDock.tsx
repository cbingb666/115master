import type { PropType, SlotsType } from 'vue'
import { Pill } from '@115master/ui'
import { useResizeObserver } from '@vueuse/core'
import { computed, defineComponent, ref, Transition } from 'vue'

export type DriveBottomMode = 'actions' | 'pagination' | null

const DriveBottomDock = defineComponent({
  name: 'DriveBottomDock',
  props: {
    mode: {
      type: String as PropType<DriveBottomMode>,
      default: null,
    },
  },
  slots: Object as SlotsType<{
    default: (props: { mode: Exclude<DriveBottomMode, null> }) => void
  }>,
  setup: (props, { slots }) => {
    const content = ref<HTMLElement>()
    const size = ref<{ height: number, width: number }>()

    useResizeObserver(content, ([entry]) => {
      const item = entry.target as HTMLElement
      size.value = { height: item.offsetHeight, width: item.offsetWidth }
    })

    const style = computed(() => size.value
      ? {
          height: `${size.value.height}px`,
          width: `${size.value.width}px`,
        }
      : undefined)

    return () => (
      <div class="drive-bottom-dock ui-z-elevated pointer-events-none fixed right-0 bottom-[var(--drive-bottom-gap)] left-(--sider-width) grid grid-cols-1">
        <Transition name="drive-bottom-dock">
          {props.mode && (
            <Pill
              key="surface"
              as="div"
              variant="glass-floating"
              size="md"
              class="drive-bottom-surface pointer-events-auto col-start-1 row-start-1 box-content grid min-h-0 grid-cols-1 justify-self-center overflow-hidden p-0 transition-[width,height] duration-[180ms] ease-[var(--ui-ease-move)] motion-reduce:transition-none"
              style={style.value}
            >
              <Transition name="drive-bottom-content">
                <div
                  ref={content}
                  key={props.mode}
                  class="pointer-events-auto col-start-1 row-start-1 justify-self-center"
                >
                  {slots.default?.({ mode: props.mode })}
                </div>
              </Transition>
            </Pill>
          )}
        </Transition>
      </div>
    )
  },
})

export default DriveBottomDock
