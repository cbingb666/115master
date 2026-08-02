import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import type { Sort } from './FileSortSelector.types'
import { Button } from '@115master/ui'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'
import { SORT_OPTIONS } from './config'

/**
 * 排序选项列表（含目录置顶）。
 * 既作 FileSortSelector 下拉内容，也在 Header“更多”菜单里扁平复用。
 */
const SortOptions = defineComponent({
  name: 'SortOptions',
  props: {
    order: {
      type: String as PropType<Share.Base.Sorter['o']>,
      required: true,
    },
    asc: {
      type: Number as PropType<Share.Base.Sorter['asc']>,
      required: true,
    },
    fc_mix: {
      type: Number as PropType<Share.Base.Sorter['fc_mix']>,
      required: true,
    },
    onSort: {
      type: Function as PropType<(order: Share.Base.Sorter['o'], asc: Share.Base.Sorter['asc'], fc_mix: Share.Base.Sorter['fc_mix']) => void>,
      required: true,
    },
  },
  setup: (props) => {
    const close = () => {
      (document.activeElement as HTMLElement)?.blur()
    }

    const handleSort = (option: Sort) => {
      close()
      props.onSort(option.order, option.asc, props.fc_mix)
    }

    const handleFcMix = () => {
      close()
      props.onSort(props.order, props.asc, props.fc_mix === 1 ? 0 : 1)
    }

    const active = (option: Sort) => {
      return props.order === option.order && props.asc === option.asc
    }

    return () => (
      <>
        <li class="">
          <a>
            <input
              class="toggle toggle-sm toggle-primary"
              checked={props.fc_mix === 0}
              tabindex="0"
              type="checkbox"
              onChange={handleFcMix}
            />
            目录置顶
          </a>
        </li>
        <li class="border-base-content mx-2 my-1 border-t" />
        {SORT_OPTIONS.map((option, i, list) => {
          if (i > 0 && list[i - 1].order === option.order)
            return []

          const items = list.filter(item => item.order === option.order)
          const on = props.order === option.order
          const item = (
            <li key={option.order} class="sm:w-42">
              <div
                class={{
                  'flex items-center gap-1 px-3 py-2 transition-colors ease-[var(--ui-ease-standard)]': true,
                  'bg-primary/15 active:bg-primary/25': on,
                  'active:bg-primary/10': !on,
                }}
              >
                <Icon class="text-lg" name={option.icon} />
                <span class="mr-auto ml-2">{option.name}</span>
                {items.map((sub) => {
                  const onItem = active(sub)

                  return (
                    <Button
                      key={`${sub.order}-${sub.asc}`}
                      color={onItem ? 'primary' : 'default'}
                      variant={onItem ? 'solid' : 'ghost'}
                      size="xs"
                      shape="circle"
                      active={onItem}
                      aria-label={`${option.name}${sub.asc === 1 ? '升序' : '降序'}`}
                      tabindex="0"
                      onClick={() => handleSort(sub)}
                    >
                      <Icon
                        class={`text-sm ${sub.asc === 1 ? '' : 'rotate-180'}`}
                        name={I.ARROW_UP}
                      />
                    </Button>
                  )
                })}
              </div>
            </li>
          )

          return item
        })}
      </>
    )
  },
})

export default SortOptions
