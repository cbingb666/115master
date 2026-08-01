import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import { defineComponent, Fragment, toValue } from 'vue'
import { Icon } from '@/icons'
import { ContextMenu } from '../ContextMenu'

/**
 * 通用上下文菜单：ContextMenu 壳 + `Action[][]` 数据驱动渲染。
 *
 * 右键 / 溢出菜单的通用层；item 类型与业务无关。
 */
const ActionMenu = defineComponent({
  name: 'ActionMenu',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    position: {
      type: Object as PropType<{ x: number, y: number }>,
      default: () => ({ x: 0, y: 0 }),
    },
    actionConfig: {
      type: Array as PropType<Action[][]>,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    return () => (
      <ContextMenu
        position={props.position}
        show={props.show}
        onClose={() => props.onClose?.()}
      >
        {props.actionConfig.map((group, index) => {
          const items = group.filter(item =>
            item.show === undefined || toValue(item.show),
          )
          if (items.length === 0)
            return null
          return (
            <Fragment key={group.map(item => item.name).join(':')}>
              <ul>
                {items.map(item => (
                  <li key={item.name}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        item.onClick?.(item)
                        props.onClose?.()
                      }}
                    >
                      <Icon
                        class={toValue(item.active)
                          ? item.activeIconColor || 'text-primary'
                          : item.iconColor || ''}
                        name={(toValue(item.active) && item.activeIcon
                          ? item.activeIcon
                          : item.icon)}
                      />
                      {toValue(item.active) && item.activeLabel
                        ? item.activeLabel
                        : item.label}
                    </button>
                  </li>
                ))}
              </ul>
              {index < props.actionConfig.length - 1 && (
                <hr class="border-base-content/10 mx-2 my-1" />
              )}
            </Fragment>
          )
        })}
      </ContextMenu>
    )
  },
})

export default ActionMenu
