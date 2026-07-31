import type { PropType } from 'vue'
import { Button, Tooltip } from '@115master/ui'
import { defineComponent } from 'vue'
import { Header, HeaderEnd, HeaderStart } from '@/components/Header'
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
      <Header>
        <HeaderStart>
          <Button
            class="rounded-full"
            variant="glass-floating"
            title="退出多选"
            onClick={() => props.onExit()}
          >
            <Icon class="text-xl" name={I.CLOSE} />
            <span class="tabular-nums">
              {props.count}
              {' '}
              项
            </span>
          </Button>
        </HeaderStart>
        <HeaderEnd>
          {props.onSelectAll && (
            <Tooltip content="全选">
              <Button
                variant="glass-floating"
                shape="circle"
                onClick={() => props.onSelectAll?.()}
              >
                <Icon class="text-xl" name={I.SELECT_ALL} />
              </Button>
            </Tooltip>
          )}
          {props.onInvert && (
            <Tooltip content="反选">
              <Button
                variant="glass-floating"
                shape="circle"
                onClick={() => props.onInvert?.()}
              >
                <Icon class="text-xl" name={I.INVERT} />
              </Button>
            </Tooltip>
          )}
        </HeaderEnd>
      </Header>
    )
  },
})

export default SelectionHeader
