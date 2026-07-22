import type { PropType } from 'vue'
import type { ActionBarItem, ActionBarItemState } from './FileActionBar.types'
import type { IconName } from '@/icons'
import { defineComponent, ref, toValue, triggerRef } from 'vue'
import { Icon } from '@/icons'
import Pill from '../Pill/Pill'

/**
 * 文件操作栏
 */
const FileActionBar = defineComponent({
  name: 'FileActionBar',
  props: {
    data: {
      type: Array as PropType<ActionBarItem[][]>,
      required: true,
    },
    onClickItem: {
      type: Function as PropType<
        (item: ActionBarItem) => Promise<void> | void
      >,
      default: () => {},
    },
  },
  setup: (props) => {
    const itemStateMap = ref<Map<string, ActionBarItemState>>(
      new Map<string, ActionBarItemState>(),
    )

    function setItemState(
      item: ActionBarItem,
      update: (state: ActionBarItemState) => ActionBarItemState,
    ) {
      itemStateMap.value.set(
        item.name,
        update(itemStateMap.value.get(item.name) ?? { isLoading: false }),
      )
      triggerRef(itemStateMap)
    }

    function setLoading(item: ActionBarItem, isLoading: boolean) {
      setItemState(item, state => ({ ...state, isLoading }))
    }

    function handleItemClick(item: ActionBarItem) {
      const result = item.onClick?.(item)
      if (result instanceof Promise) {
        // loading
        setLoading(item, true)
        result.finally(() => {
          setLoading(item, false)
        })
      }
    }

    return () => (
      <div class="pointer-events-none fixed right-0 bottom-16 left-(--sider-width) flex items-center justify-center">
        <Pill as="div" class="pill-xl pointer-events-auto justify-center p-1.5">
          {
            props.data.map((group, groupIndex) => {
              const groupItems = group.filter(item =>
                item.show === undefined || toValue(item.show),
              )
              return (
                <>
                  {/* group */}
                  <div class="flex items-center justify-center">
                    {
                      groupItems.map((item) => {
                        const isLoading = itemStateMap.value.get(item.name)?.isLoading

                        const label = toValue(item.active) && item.activeLabel
                          ? item.activeLabel
                          : item.label

                        const icon = toValue(item.active) && item.activeIcon
                          ? item.activeIcon
                          : item.icon

                        const iconColor = toValue(item.active) && item.activeIconColor
                          ? item.activeIconColor
                          : item.iconColor

                        return (
                          <button
                            key={item.icon}
                            class="
                              text-base-content hover:bg-base-content/10
                              tooltip tooltip-top relative flex h-11
                              w-11 cursor-pointer
                              items-center justify-center rounded-full
                              transition-all duration-150
                            "
                            data-tip={label}
                            title={label}
                            onClick={() => handleItemClick(item)}
                          >
                            {/* loading */}
                            <span
                              class={[
                                'loading loading-spinner loading-md',
                                'absolute inset-0 m-auto',
                                'transition-all',
                                isLoading ? 'opacity-100' : 'opacity-0',
                              ]}
                            />
                            {/* icon */}
                            <Icon
                              class={[
                                'drop-shadow-base-200/50 size-6 drop-shadow-sm',
                                isLoading ? 'opacity-20' : '',
                                iconColor,
                              ]}
                              name={icon as IconName}
                            />
                          </button>
                        )
                      })
                    }
                  </div>
                  {

                    (groupIndex < props.data.length - 1) && (
                      <div class="bg-base-content/20 mx-1 h-8 w-px" />
                    )
                  }
                </>
              )
            })
          }
        </Pill>
      </div>
    )
  },
})

export default FileActionBar
