import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { I, Icon } from '@/icons'
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
            <button
              class="btn btn-sm btn-glass rounded-full"
              tabindex="0"
              {..._props}
            >
              <Icon class="text-2xl" name={I.DOCUMENT} />
              <span class="hidden sm:inline">{props.currentPageSize}</span>
            </button>
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
