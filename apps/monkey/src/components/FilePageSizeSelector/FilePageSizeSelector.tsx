import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { ResponsiveMenu } from '@/components'
import { PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants'

/**
 * 文件页大小选择器
 */
const FilePageSizeSelector = defineComponent({
  name: 'FilePageSizeSelector',
  props: {
    /**
     * 当前页大小
     */
    currentPageSize: {
      type: Number,
      required: true,
    },
    /**
     * 改变页大小
     */
    onChangePageSize: {
      type: Function as PropType<(size: number) => void>,
      default: () => {},
    },
  },
  setup(props) {
    const handlePageSize = (size: number) => {
      (document.activeElement as HTMLElement)?.blur()
      props.onChangePageSize(size)
    }

    return () => (
      <ResponsiveMenu title="请选择页大小">
        {{
          target: (_props: object) => (
            <button
              class="btn btn-ghost"
              tabindex="0"
              {..._props}
            >
              <Icon class="text-2xl" icon="fluent:document-one-page-multiple-16-regular" />
              <span class="w-10">{props.currentPageSize}</span>
            </button>
          ),
          default: (_props: object) => (
            <ul {..._props}>
              {PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS.map(option => (
                <li key={option} class="sm:w-36">
                  <a
                    class={{ 'bg-primary': props.currentPageSize === option }}
                    tabindex="0"
                    onClick={() => handlePageSize(option)}
                  >
                    {option}
                  </a>
                </li>
              ))}
            </ul>

          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FilePageSizeSelector
