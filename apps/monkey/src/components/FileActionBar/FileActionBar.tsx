import type { PropType } from 'vue'
import type { ActionBarItem, ActionBarItemState } from './FileActionBar.types'
import { Icon } from '@iconify/vue'
import { defineComponent, ref, toValue, triggerRef } from 'vue'

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
      <div class="pointer-events-none fixed inset-x-0 bottom-18 flex items-center justify-center">
        <div
          class="
            rounded-box pointer-events-auto flex items-center
            justify-center bg-neutral-800/80
            shadow-md ring-1 shadow-neutral-950/50 ring-neutral-700/80
            backdrop-blur-xl backdrop-brightness-70 backdrop-saturate-180
          "
        >
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
                              group btn btn-xl btn-ghost max-sm:btn-md
                              rounded-box tooltip tooltip-top hover:bg-base-content/5
                              relative flex
                              items-center justify-center
                              border-none transition-opacity
                            "
                            data-tip={label}
                            title={label}
                            onClick={() => handleItemClick(item)}
                          >
                            {/* loading */}
                            <span
                              class={[
                                'loading loading-spinner loading-xl',
                                'absolute inset-0 m-auto',
                                'transition-all',
                                isLoading ? 'opacity-100' : 'opacity-0',
                              ]}
                            />
                            {/* icon */}
                            <Icon
                              class={[
                                'drop-shadow-base-200/50 size-8 drop-shadow-sm max-sm:size-5',
                                isLoading ? 'opacity-20' : '',
                                iconColor,
                              ]}
                              icon={icon}
                            />
                          </button>
                        )
                      })
                    }
                  </div>
                  {

                    (groupIndex < props.data.length - 1) && (
                      <div class="bg-base-content/20 mx-2 h-8 w-px" />
                    )
                  }
                </>
              )
            })
          }
        </div>
      </div>
    )
  },
})

export default FileActionBar
