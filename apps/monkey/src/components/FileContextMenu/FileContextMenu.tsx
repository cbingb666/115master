import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import { ContextMenu } from '@115master/ui'
import { defineComponent, toValue } from 'vue'
import { Icon } from '@/icons'

/**
 * 文件上下文菜单
 */
const FileContextMenu = defineComponent({
  name: 'FileContextMenu',
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
    /**
     * 关闭时回调
     */
    onClose: {
      type: Function,
      default: () => {},
    },
  },
  setup: (props) => {
    return () => (
      <ContextMenu
        open={props.show}
        position={props.position}
        onClose={() => {
          props.onClose?.()
        }}
      >
        {
          props.actionConfig.map((group, index) => {
            const items = group.filter(item =>
              item.show === undefined || toValue(item.show),
            )
            if (items.length === 0)
              return null
            return (
              <>
                <ul key={index} role="group">
                  {
                    items.map((item, index) => (
                      <li key={index} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            item.onClick?.(item)
                            props.onClose?.()
                          }}
                        >
                          <Icon
                            class={[
                              ...(toValue(item.active)
                                ? [item.activeIconColor || 'text-primary']
                                : [item.iconColor || '']),

                            ]}
                            name={(toValue(item.active) && item.activeIcon
                              ? item.activeIcon
                              : item.icon)}
                          >
                          </Icon>
                          {toValue(item.active) && item.activeLabel
                            ? item.activeLabel
                            : item.label}
                        </button>
                      </li>
                    ))
                  }
                </ul>
                {index < props.actionConfig.length - 1 && (
                  <hr class="border-base-content/10 mx-2 my-1" role="separator" />
                )}
              </>
            )
          })
        }
      </ContextMenu>
    )
  },
})

export default FileContextMenu
