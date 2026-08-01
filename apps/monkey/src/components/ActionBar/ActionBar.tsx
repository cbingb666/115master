import type { PropType } from 'vue'
import type { Action } from '@/types/action'
import { Button, Pill, Tooltip } from '@115master/ui'
import { defineComponent, Fragment, ref, toValue, triggerRef } from 'vue'
import { Icon } from '@/icons'

/**
 * 分组操作栏
 */
const ActionBar = defineComponent({
  name: 'ActionBar',
  props: {
    groups: {
      type: Array as PropType<Action[][]>,
      required: true,
    },
  },
  setup: (props) => {
    const loading = ref(new Set<string>())

    function setLoading(item: Action, value: boolean) {
      if (value) {
        loading.value.add(item.name)
        triggerRef(loading)
        return
      }
      loading.value.delete(item.name)
      triggerRef(loading)
    }

    function handleClick(item: Action) {
      const result = item.onClick?.(item)
      if (result instanceof Promise) {
        setLoading(item, true)
        result.finally(() => {
          setLoading(item, false)
        })
      }
    }

    return () => {
      const groups = props.groups
        .map(group => group.filter(item =>
          item.show === undefined || toValue(item.show),
        ))
        .filter(group => group.length > 0)

      return (
        <Pill
          as="div"
          variant="glass-floating"
          size="xl"
          class="pointer-events-auto justify-center p-1.5"
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={group.map(item => item.name).join(':')}>
              <div class="flex items-center justify-center">
                {group.map((item) => {
                  const isLoading = loading.value.has(item.name)
                  const active = toValue(item.active)
                  const label = active && item.activeLabel
                    ? item.activeLabel
                    : item.label
                  const icon = active && item.activeIcon
                    ? item.activeIcon
                    : item.icon
                  const iconColor = active && item.activeIconColor
                    ? item.activeIconColor
                    : item.iconColor

                  return (
                    <Tooltip
                      key={item.name}
                      content={label}
                      placement="top"
                    >
                      <Button
                        aria-label={label}
                        variant="ghost"
                        shape="circle"
                        class="relative h-11 w-11"
                        onClick={() => handleClick(item)}
                      >
                        <span
                          class={[
                            'loading loading-spinner loading-md',
                            'absolute inset-0 m-auto',
                            'transition-all',
                            isLoading ? 'opacity-100' : 'opacity-0',
                          ]}
                        />
                        <Icon
                          class={[
                            'drop-shadow-base-200/50 size-6 drop-shadow-sm',
                            isLoading ? 'opacity-20' : '',
                            iconColor,
                          ]}
                          name={icon}
                        />
                      </Button>
                    </Tooltip>
                  )
                })}
              </div>
              {groupIndex < groups.length - 1 && (
                <div class="bg-base-content/20 mx-1 h-8 w-px" />
              )}
            </Fragment>
          ))}
        </Pill>
      )
    }
  },
})

export default ActionBar
