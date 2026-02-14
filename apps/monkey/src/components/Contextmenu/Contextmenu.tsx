import type { MaybeElement } from '@vueuse/core'
import type { PropType } from 'vue'
import { useScrollLock } from '@vueuse/core'
import { defineComponent, nextTick, shallowRef, Teleport, Transition, watch, withModifiers } from 'vue'

const styles = {
  mask: [
    'fixed',
    'inset-0',
    'z-1000',
    'cursor-pointer',
  ],
  main: [
    'fixed top-0 left-0',
    'rounded-xl',
    'bg-base-200/70',
    'liquid-glass',
    'before:backdrop-blur-xl',
    'before:rounded-xl',
    'after:rounded-xl',
    'shadow-xl',
    'shadow-base-100/70',
    'menu',
    'z-1000',
  ],
}

const Contextmenu = defineComponent({
  name: 'Contextmenu',
  props: {
    /**
     * 是否显示
     */
    show: {
      type: Boolean,
      default: false,
    },
    /**
     * 显示位置
     */
    position: {
      type: Object as PropType<{
        x: number
        y: number
      }>,
      default: () => ({
        x: 0,
        y: 0,
      }),
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  setup: (props, { slots }) => {
    const menuRef = shallowRef<MaybeElement>()
    const lock = useScrollLock(document.body)
    const adjustedPosition = shallowRef({ x: 0, y: 0 })

    /**
     * 计算调整后的位置，避免超出视窗边界
     */
    const calculatePosition = async () => {
      if (!menuRef.value)
        return

      await nextTick()

      const menuElement = menuRef.value as HTMLElement
      const rect = menuElement.getBoundingClientRect()
      const menuWidth = rect.width
      const menuHeight = rect.height

      /** 获取视窗尺寸 */
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let x = props.position.x
      let y = props.position.y

      // 右边界检测
      if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10 // 留10px边距
      }

      // 左边界检测
      if (x < 10) {
        x = 10
      }

      // 下边界检测
      if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10 // 留10px边距
      }

      // 上边界检测
      if (y < 10) {
        y = 10
      }

      adjustedPosition.value = { x, y }
    }

    watch(() => props.show, (value) => {
      if (value) {
        lock.value = true
        // 初始位置设置为原始位置
        adjustedPosition.value = { x: props.position.x, y: props.position.y }
        // 下一帧计算调整后的位置
        nextTick(() => {
          calculatePosition()
        })
      }
      else {
        lock.value = false
      }
    })

    // 监听位置变化，重新计算
    watch(() => props.position, () => {
      if (props.show) {
        adjustedPosition.value = { x: props.position.x, y: props.position.y }
        nextTick(() => {
          calculatePosition()
        })
      }
    }, { deep: true })

    return () => (
      <>
        <Teleport to="#my-app">
          {
            props.show && (
              <div
                class={styles.mask}
                onClick={withModifiers(() => {
                  props.onClose?.()
                }, ['self', 'stop'])}
                onContextmenu={withModifiers(() => {
                  props.onClose?.()
                }, ['prevent'])}
              >
              </div>
            )
          }
          <Transition
            enterActiveClass="duration-100 ease-out"
            enterFromClass="opacity-0 scale-95"
            enterToClass="opacity-100 scale-100"
            leaveActiveClass="duration-150 ease-in"
            leaveFromClass="opacity-100 scale-100"
            leaveToClass="opacity-0 scale-95"
          >
            {
              props.show && (
                <div
                  ref={menuRef}
                  class={styles.main}
                  style={{
                    left: `${adjustedPosition.value.x}px`,
                    top: `${adjustedPosition.value.y}px`,
                  }}
                >
                  {slots.default?.()}
                </div>
              )
            }
          </Transition>
        </Teleport>
      </>
    )
  },
})

export default Contextmenu
