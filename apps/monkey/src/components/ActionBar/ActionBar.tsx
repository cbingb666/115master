import type { ActionMenuGroup, ActionMenuItem } from '@115master/ui'
import type { PropType } from 'vue'
import { Button, Pill, Tooltip } from '@115master/ui'
import { defineComponent, Fragment, ref, toValue, triggerRef } from 'vue'

/**
 * 分组操作栏
 */
const ActionBar = defineComponent({
  name: 'ActionBar',
  props: {
    groups: {
      type: Array as PropType<readonly ActionMenuGroup[]>,
      required: true,
    },
    /** Glass 材质由外层容器承载 */
    embedded: {
      type: Boolean,
      default: false,
    },
  },
  setup: (props) => {
    const loading = ref(new Set<string>())

    function setLoading(item: ActionMenuItem, value: boolean) {
      if (value) {
        loading.value.add(item.id)
        triggerRef(loading)
        return
      }
      loading.value.delete(item.id)
      triggerRef(loading)
    }

    function select(item: ActionMenuItem) {
      const result = item.onSelect()
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
          item.visible === undefined || toValue(item.visible),
        ))
        .filter(group => group.length > 0)

      return (
        <Pill
          as="div"
          variant={props.embedded ? 'plain' : 'glass-floating'}
          size={props.embedded ? 'md' : 'xl'}
          class={[
            'pointer-events-auto justify-center',
            props.embedded ? 'p-1' : 'p-1.5',
          ]}
        >
          {groups.map((group, groupIndex) => (
            <Fragment key={group.map(item => item.id).join(':')}>
              <div class="flex items-center justify-center">
                {group.map((item) => {
                  const isLoading = loading.value.has(item.id)
                  const label = toValue(item.label)
                  const tone = item.tone === undefined ? 'default' : toValue(item.tone)

                  return (
                    <Tooltip
                      key={item.id}
                      content={label}
                      placement="top"
                    >
                      <Button
                        aria-label={label}
                        variant="ghost"
                        shape="circle"
                        class="relative h-11 w-11"
                        disabled={item.disabled === undefined ? false : toValue(item.disabled)}
                        onClick={() => select(item)}
                      >
                        <span
                          class={[
                            'loading loading-spinner loading-md',
                            'absolute inset-0 m-auto',
                            'transition-all ease-[var(--ui-ease-standard)]',
                            isLoading ? 'opacity-100' : 'opacity-0',
                          ]}
                        />
                        {item.leading && (
                          <span
                            class={[
                              'flex size-6 items-center justify-center [&>*]:size-6',
                              'drop-shadow-base-200/50 drop-shadow-sm',
                              'transition-all ease-[var(--ui-ease-standard)]',
                              tone === 'primary' ? 'text-primary' : '',
                              tone === 'destructive' ? 'text-error' : '',
                              isLoading ? 'opacity-20' : '',
                            ]}
                            aria-hidden="true"
                          >
                            {item.leading()}
                          </span>
                        )}
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
