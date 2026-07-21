import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { Tooltip } from '@/components/Tooltip'
import { I, Icon } from '@/icons'

/**
 * 多选头部（退出多选 + 已选数量 + 全选/反选）
 */
const SelectionHeader = defineComponent({
  name: 'SelectionHeader',
  props: {
    /**
     * 已选数量
     */
    count: {
      type: Number,
      required: true,
    },
    /**
     * 退出多选
     */
    onExit: {
      type: Function as PropType<() => void>,
      required: true,
    },
    /**
     * 全选；提供则渲染全选按钮
     */
    onSelectAll: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    /**
     * 反选；提供则渲染反选按钮
     */
    onInvert: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  setup: (props) => {
    return () => (
      <>
        <div class="relative flex min-w-0 flex-1 items-center gap-4 overflow-hidden">
          <button
            class="btn btn-glass rounded-full"
            title="退出多选"
            onClick={() => props.onExit()}
          >
            <Icon class="text-xl" name={I.CLOSE} />
            <span class="tabular-nums">
              {props.count}
              {' '}
              项
            </span>
          </button>
        </div>
        <div class="flex flex-none items-center gap-2">
          {props.onSelectAll && (
            <Tooltip content="全选">
              <button
                class="btn btn-glass rounded-full"
                onClick={() => props.onSelectAll?.()}
              >
                <Icon class="text-xl" name={I.SELECT_ALL} />
              </button>
            </Tooltip>
          )}
          {props.onInvert && (
            <Tooltip content="反选">
              <button
                class="btn btn-glass rounded-full"
                onClick={() => props.onInvert?.()}
              >
                <Icon class="text-xl" name={I.INVERT} />
              </button>
            </Tooltip>
          )}
        </div>
      </>
    )
  },
})

export default SelectionHeader
