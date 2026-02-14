import type { PropType } from 'vue'
import type { Sort } from '@/components/FileSortSelector/FileSortSelector.types'
import type { WebApi } from '@/utils/drive115/api'
import { Icon } from '@iconify/vue'
import { computed, defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { SORT_OPTIONS } from '@/components/FileSortSelector/config'

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
    const currentSortOption = computed(() => {
      return SORT_OPTIONS.find(option => option.order === props.order && option.asc === props.asc)
    })

    const sortIcon = computed(() => {
      return currentSortOption.value?.icon ?? 'mdi:sort'
    })

    const sortName = computed(() => {
      return currentSortOption.value?.name ?? '排序'
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
          target: () => (
            <button
              class="btn btn-ghost"
              tabindex="0"
            >
              <Icon class="text-2xl" icon={sortIcon.value} />
              {sortName.value}
            </button>
          ),
          default: () => (
            <>
              <li class="sm:w-32">
                <a>
                  <input
                    class="toggle toggle-sm"
                    checked={props.fc_mix === 1}
                    tabindex="0"
                    type="checkbox"
                    onChange={handleFcMix}
                  />
                  目录置顶
                </a>
              </li>
              {SORT_OPTIONS.map(option => (
                <li key={option.name} class="sm:w-32">
                  <a
                    class={{ 'bg-primary': isSortOptionActive(option) }}
                    tabindex="0"
                    onClick={() => handleSort(option)}
                  >
                    <Icon class="text-xl" icon={option.icon ?? 'mdi:sort'} />
                    {option.name}
                  </a>
                </li>
              ))}
            </>
          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FileSortSelector
