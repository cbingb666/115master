import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { Button, Tooltip } from '@115master/ui'
import { computed, defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { I, Icon } from '@/icons'
import { SORT_OPTIONS } from './config'
import SortOptions from './SortOptions'

/**
 * 文件排序选择器（触发钮 + 下拉）。
 * 选项列表抽成 SortOptions，供 Header“更多”菜单扁平复用。
 */
const FileSortSelector = defineComponent({
  name: 'FileSortSelector',
  props: {
    /**
     * 排序方式
     */
    order: {
      type: String as PropType<Share.Base.Sorter['o']>,
      required: true,
    },
    /**
     * 升序
     */
    asc: {
      type: Number as PropType<Share.Base.Sorter['asc']>,
      required: true,
    },
    /**
     * 目录置顶
     */
    fc_mix: {
      type: Number as PropType<Share.Base.Sorter['fc_mix']>,
      required: true,
    },
    /**
     * 切换排序
     */
    onSort: {
      type: Function as PropType<(order: Share.Base.Sorter['o'], asc: Share.Base.Sorter['asc'], fc_mix: Share.Base.Sorter['fc_mix']) => void>,
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
      return current.value?.icon ?? I.SORT
    })

    return () => (
      <ResponsiveMenu title="请选择排序方式">
        {{
          target: (_props: object) => (
            <Tooltip content={`当前排序：${sortLabel.value}${props.fc_mix === 0 ? '（目录置顶）' : ''}`}>
              <Button
                variant="glass-floating"
                shape="circle"
                aria-label={`当前排序：${sortLabel.value}`}
                tabindex="0"
                {..._props}
              >
                <span class="relative inline-flex items-center">
                  {
                    props.fc_mix === 0
                    && <div class="bg-primary absolute top-0 -left-1 size-1.5 -translate-y-1/2 rounded-full" />
                  }
                  <Icon class="text-xl" name={sortField.value} />
                  <Icon
                    size="custom"
                    class={`text-base-content/70 absolute -right-1 -bottom-0.5 size-2.5 ${props.asc === 1 ? '' : 'rotate-180'}`}
                    name={I.ARROW_UP}
                  />
                </span>
              </Button>
            </Tooltip>
          ),
          default: () => (
            <SortOptions
              order={props.order}
              asc={props.asc}
              fc_mix={props.fc_mix}
              onSort={props.onSort}
            />
          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FileSortSelector
