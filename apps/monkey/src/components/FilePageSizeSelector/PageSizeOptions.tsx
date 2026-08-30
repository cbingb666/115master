import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants'

/**
 * 每页条数选项列表。作 FilePageSizeSelector 下拉内容，也供“更多”菜单扁平复用。
 */
const PageSizeOptions = defineComponent({
  name: 'PageSizeOptions',
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
    const handle = (size: number) => {
      (document.activeElement as HTMLElement)?.blur()
      props.onChangePageSize(size)
    }

    return () => (
      <>
        {PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS.map(option => (
          <li key={option} class="w-full">
            <a
              class={{ 'bg-primary text-primary-content': props.currentPageSize === option }}
              tabindex="0"
              onClick={() => handle(option)}
            >
              {option}
            </a>
          </li>
        ))}
      </>
    )
  },
})

export default PageSizeOptions
