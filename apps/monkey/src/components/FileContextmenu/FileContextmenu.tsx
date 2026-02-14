import type { MaybeElement } from '@vueuse/core'
import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import { Icon } from '@iconify/vue'
import { defineComponent, shallowRef, toValue } from 'vue'
import { Contextmenu } from '../Contextmenu'

const FileContextmenu = defineComponent({
  name: 'FileContextmenu',
  props: {
    /**
     * 是否显示
     */
    show: {
      type: Boolean,
      default: false,
    },
    /**
     * 位置
     */
    position: {
      type: Object as PropType<{ x: number, y: number }>,
      default: () => ({ x: 0, y: 0 }),
    },
    /**
     * 操作配置
     */
    actionConfig: {
      type: Array as PropType<Action[][]>,
      required: true,
    },
    onClose: {
      type: Function,
      default: () => {},
    },
  },
  setup: (props) => {
    const contextmenuRef = shallowRef<MaybeElement>()

    return () => (
      <Contextmenu
        ref={contextmenuRef}
        position={props.position}
        show={props.show}
        onClose={() => {
          props.onClose?.()
        }}
      >
        {
          props.actionConfig.map((group, index) => (
            <>
              <ul key={index}>
                {
                  group.map((item, index) => (
                    <li key={index}>
                      <a onClick={() => {
                        item.onClick?.(item)
                        props.onClose?.()
                      }}
                      >
                        <Icon
                          class={[
                            'size-6',
                            ...(toValue(item.active)
                              ? [item.activeIconColor || 'text-primary']
                              : [item.iconColor || '']),

                          ]}
                          icon={toValue(item.active) && item.activeIcon
                            ? item.activeIcon
                            : item.icon}
                        >
                        </Icon>
                        {toValue(item.active) && item.activeLabel
                          ? item.activeLabel
                          : item.label}
                      </a>
                    </li>
                  ))
                }
              </ul>
              {index < props.actionConfig.length - 1 && (
                <hr class="border-base-content/10 my-1" />
              )}
            </>
          ))
        }
      </Contextmenu>
    )
  },
})

export default FileContextmenu
