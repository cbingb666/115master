import type { PropType } from 'vue'
import type { ActionBarItem, ActionBarItemState } from '@/components/FileActionBar/types'
import { Icon } from '@iconify/vue'
import { defineComponent, ref, toValue, triggerRef } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'fixed right-0 bottom-18 left-0',
    'flex items-center justify-center',
    'pointer-events-none',
  ],
  wrap: [
    'flex items-center justify-center',
    'bg-neutral-800/80',
    'backdrop-blur-xl backdrop-brightness-70 backdrop-saturate-180',
    'ring-1 ring-neutral-700/80',
    'shadow-md shadow-neutral-950/50',
    'rounded-box',
    'pointer-events-auto',
  ],
  group: [
    'flex items-center justify-center',
  ],
  button: [
    'group relative',
    'btn btn-xl btn-ghost border-none',
    'flex items-center justify-center',
    'hover:bg-base-content/5',
    'transition-opacity',
    'max-sm:btn-md',
    'rounded-box',
    'tooltip tooltip-top',
  ],
  icon: [
    'size-8',
    'max-sm:size-5',
    'drop-shadow-base-200/50 drop-shadow-sm',
  ],
  iconHide: [
    'opacity-20',
  ],
  loading: [
    'absolute inset-0 m-auto',
    'loading loading-spinner loading-xl',
    'opacity-0',
    'transition-all',
  ],
  loadingShow: [
    'opacity-100',
  ],
  divider: [
    'bg-base-content/20',
    'h-8 w-px',
    'mx-2',
  ],
})

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
      <div class={styles.root}>
        <div class={styles.wrap}>
          {
            props.data.map((group, groupIndex) => {
              const groupItems = group.filter(item =>
                item.show === undefined || toValue(item.show),
              )
              return (
                <>
                  {/* group */}
                  <div class={styles.group}>
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
                            class={styles.button}
                            data-tip={label}
                            title={label}
                            onClick={() => handleItemClick(item)}
                          >
                            {/* loading */}
                            <span
                              class={[
                                styles.loading,
                                ...(isLoading
                                  ? [styles.loadingShow]
                                  : []),
                              ]}
                            />
                            {/* icon */}
                            <Icon
                              class={[
                                styles.icon,
                                ...(isLoading
                                  ? [styles.iconHide]
                                  : []),
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
                      <div class={styles.divider} />
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
