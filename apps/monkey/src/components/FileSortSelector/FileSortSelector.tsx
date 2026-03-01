import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import type { Sort } from './FileSortSelector.types'
import { Icon } from '@iconify/vue'
import { computed, defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { SORT_OPTIONS } from './config'

function dirIcon(asc: WebApi.Entity.Sorter['asc']) {
  return asc === 1 ? 'material-symbols:arrow-upward-rounded' : 'material-symbols:arrow-downward-rounded'
}

/**
 * 文件排序选择器
 */
const FileSortSelector = defineComponent({
  name: 'FileSortSelector',
  props: {
    /**
     * 排序方式
     */
    order: {
      type: String as PropType<WebApi.Entity.Sorter['o']>,
      required: true,
    },
    /**
     * 升序
     */
    asc: {
      type: Number as PropType<WebApi.Entity.Sorter['asc']>,
      required: true,
    },
    /**
     * 目录置顶
     */
    fc_mix: {
      type: Number as PropType<WebApi.Entity.Sorter['fc_mix']>,
      required: true,
    },
    /**
     * 切换排序
     */
    onSort: {
      type: Function as PropType<(order: WebApi.Entity.Sorter['o'], asc: WebApi.Entity.Sorter['asc'], fc_mix: WebApi.Entity.Sorter['fc_mix']) => void>,
      required: true,
    },
  },
  setup: (props) => {
    const current = computed(() => {
      return SORT_OPTIONS.find(option => option.order === props.order && option.asc === props.asc)
    })

    const sortLabel = computed(() => {
      return current.value?.name ?? '排序'
    })

    const sortField = computed(() => {
      return current.value?.icon ?? 'mdi:sort'
    })

    const sortDir = computed(() => {
      return dirIcon(props.asc)
    })

    const isSortOptionActive = (option: Sort) => {
      return props.order === option.order && props.asc === option.asc
    }

    const closeDropdown = () => {
      (document.activeElement as HTMLElement)?.blur()
    }

    const handleSort = (option: Sort) => {
      closeDropdown()
      props.onSort(option.order, option.asc, props.fc_mix)
    }

    const handleFcMix = () => {
      closeDropdown()
      props.onSort(props.order, props.asc, props.fc_mix === 1 ? 0 : 1)
    }

    return () => (
      <ResponsiveMenu title="请选择排序方式">
        {{
          target: (_props: object) => (
            <button
              class="btn btn-sm btn-glass w-full gap-1.5 rounded-full px-2 sm:px-3"
              aria-label={`当前排序：${sortLabel.value}`}
              title={`当前排序：${sortLabel.value}${props.fc_mix === 0 ? '，目录置顶已开启' : ''}`}
              tabindex="0"
              {..._props}
            >
              <span class="relative mr-3">
                {
                  props.fc_mix === 0
                  && <div class="bg-primary absolute top-1 -left-1 size-1.5 -translate-y-1/2 rounded-full" />
                }
                <Icon class="text-xl sm:text-2xl" icon={sortField.value} />
                <Icon class={`absolute ${props.asc === 1 ? 'top-0' : 'bottom-0'} -right-3 size-3`} icon={sortDir.value} />
              </span>
              <span class="relative max-w-24 truncate text-xs sm:max-w-none sm:text-sm">
                {sortLabel.value}
              </span>
            </button>
          ),
          default: () => (
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
                        'flex items-center gap-1 px-3 py-2': true,
                        'bg-base-content/30': on,
                      }}
                    >
                      <Icon class="text-lg" icon={option.icon} />
                      <span class="mr-auto ml-2">{option.name}</span>
                      {items.map((item) => {
                        const active = isSortOptionActive(item)

                        return (
                          <button
                            key={`${item.order}-${item.asc}`}
                            class={`btn btn-xs ${active ? 'btn-primary' : 'btn-ghost hover:btn-primary'}`}
                            aria-label={`${option.name}${item.asc === 1 ? '升序' : '降序'}`}
                            tabindex="0"
                            type="button"
                            onClick={() => handleSort(item)}
                          >
                            <Icon class="text-sm" icon={dirIcon(item.asc)} />
                          </button>
                        )
                      })}
                    </div>
                  </li>
                )

                return item
              })}
            </>
          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FileSortSelector
