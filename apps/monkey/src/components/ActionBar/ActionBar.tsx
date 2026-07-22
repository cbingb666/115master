import type { PropType } from 'vue'
import type { IconName } from '@/icons'
import type { Action } from '@/types/action'
import { defineComponent, Fragment, ref, toValue, triggerRef } from 'vue'
import { Icon } from '@/icons'
import Pill from '../Pill/Pill'

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
          class="pill-xl pointer-events-auto justify-center p-1.5"
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
                    <button
                      aria-label={label}
                      key={item.name}
                      class="
                        text-base-content hover:bg-base-content/10
                        tooltip tooltip-top relative flex h-11
                        w-11 cursor-pointer
                        items-center justify-center rounded-full
                        transition-all duration-150
                      "
                      data-tip={label}
                      title={label}
                      type="button"
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
                        name={icon as IconName}
                      />
                    </button>
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
