import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { Tooltip } from '@/components/Tooltip'
import { I, Icon } from '@/icons'
import Button from '../Button/Button'
import PageSizeOptions from './PageSizeOptions'

const FilePageSizeSelector = defineComponent({
  name: 'FilePageSizeSelector',
  props: {
    currentPageSize: {
      type: Number,
      required: true,
    },
    onChangePageSize: {
      type: Function as PropType<(size: number) => void>,
      default: () => {},
    },
  },
  setup(props) {
    return () => (
      <ResponsiveMenu title="请选择页大小">
        {{
          target: (_props: object) => (
            <Tooltip content={`每页 ${props.currentPageSize} 项`}>
              <Button
                variant="glass-floating"
                shape="circle"
                tabindex="0"
                {..._props}
              >
                <Icon class="text-2xl" name={I.DOCUMENT} />
              </Button>
            </Tooltip>
          ),
          default: () => (
            <PageSizeOptions
              currentPageSize={props.currentPageSize}
              onChangePageSize={props.onChangePageSize}
            />
          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FilePageSizeSelector
