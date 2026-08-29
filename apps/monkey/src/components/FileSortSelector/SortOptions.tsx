import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import type { Sort } from './FileSortSelector.types'
import { defineComponent, useId } from 'vue'
import { Icon } from '@/icons'
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
    const name = `file-sort-${useId()}`

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
        <li role="none" class="sm:w-80">
          <div
            class="grid grid-flow-col grid-cols-2 grid-rows-5 gap-1 p-1"
            role="radiogroup"
            aria-label="排序方式"
          >
            {SORT_OPTIONS.map((option) => {
              const on = active(option)

              return (
                <label
                  key={`${option.order}-${option.asc}`}
                  class={{
                    'flex cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 transition-colors ease-[var(--ui-ease-standard)]': true,
                    'border-primary/30 bg-primary/15 text-primary': on,
                    'hover:bg-base-content/10 border-transparent': !on,
                  }}
                >
                  <Icon class="shrink-0" name={option.icon} />
                  <span class="mr-auto whitespace-nowrap">{option.name}</span>
                  <input
                    class="radio radio-xs radio-primary shrink-0"
                    type="radio"
                    name={name}
                    value={`${option.order}-${option.asc}`}
                    checked={on}
                    aria-label={option.name}
                    onChange={() => handleSort(option)}
                    onKeydown={event => event.stopPropagation()}
                  />
                </label>
              )
            })}
          </div>
        </li>
      </>
    )
  },
})

export default SortOptions
