import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import { PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants'

type VisiblePageItem = number | '...'

const Pagination = defineComponent({
  name: 'Pagination',
  props: {
    /**
     * 当前页码
     */
    currentPage: {
      type: Number,
      required: true,
    },
    /**
     * 当前每页大小
     */
    currentPageSize: {
      type: Number,
      required: true,
    },
    /**
     * 总数
     */
    total: {
      type: Number,
      required: true,
    },
    /**
     * 可选的每页大小选项
     * @default PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS
     */
    pageSizeOptions: {
      type: Array as PropType<number[]>,
      default: () => PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS,
    },
    /**
     * 是否显示每页大小选择器
     * @default true
     */
    showSizeChanger: {
      type: Boolean,
      default: true,
    },
    /**
     * 每页大小改变
     * @default () => void
     */
    onPageSizeChange: {
      type: Function as PropType<(size: number) => void>,
      default: () => {},
    },
    /**
     * 当前页码改变
     * @default () => void
     */
    onCurrentPageChange: {
      type: Function as PropType<(page: number) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    const isFirstPage = computed(() => {
      return props.currentPage === 1
    })

    const isLastPage = computed(() => {
      return props.currentPage === Math.ceil(props.total / props.currentPageSize)
    })

    const pageCount = computed(() => {
      return Math.ceil(props.total / props.currentPageSize)
    })

    const visiblePages = computed<VisiblePageItem[]>(() => {
      const current = props.currentPage
      const total = pageCount.value
      const visible: VisiblePageItem[] = []

      // 总页数少于等于7页，显示所有页码
      if (total <= 7) {
        for (let i = 1; i <= total; i++) {
          visible.push(i)
        }
      }
      // 总页数大于7页，显示省略号
      else {
        if (current <= 4) {
          // 当前页在前部
          for (let i = 1; i <= 5; i++) {
            visible.push(i)
          }
          visible.push('...')
          visible.push(total)
        }
        else if (current >= total - 3) {
          // 当前页在后部
          visible.push(1)
          visible.push('...')
          for (let i = total - 4; i <= total; i++) {
            visible.push(i)
          }
        }
        else {
          // 当前页在中间
          visible.push(1)
          visible.push('...')
          for (let i = current - 1; i <= current + 1; i++) {
            visible.push(i)
          }
          visible.push('...')
          visible.push(total)
        }
      }

      return visible
    })

    /** 上一页 */
    function handlePrev() {
      props.onCurrentPageChange(props.currentPage - 1)
    }

    /** 下一页 */
    function handleNext() {
      props.onCurrentPageChange(props.currentPage + 1)
    }

    /** 跳转页码 */
    function handlePage(page: number) {
      props.onCurrentPageChange(page)
    }

    /** 切换页面大小 */
    function handlePageSize(event: Event) {
      props.onPageSizeChange?.(Number((event.target as HTMLSelectElement).value))
    }

    return () => (
      <div
        class="
          bg-base-200/70 liquid-glass
          shadow-base-100/50 inline-flex
          items-center
          rounded-3xl
          px-3
          py-2
          shadow-xl
          before:rounded-3xl
          before:backdrop-blur-xl
          after:rounded-3xl
        "
      >
        <div class="flex items-center gap-1">
          {/* prev */}
          <button
            class={`
              text-base-content text-shadow-base-100/10 hover:bg-base-content/10
              relative flex h-10
              w-10 cursor-pointer
              items-center
              justify-center rounded-full
              text-lg transition-all
              duration-150
              text-shadow-lg
              ${isFirstPage.value ? 'hover:text-base-content/70 cursor-not-allowed opacity-30 hover:bg-transparent' : ''}
            `}
            disabled={isFirstPage.value}
            onClick={handlePrev}
          >
            «
          </button>

          {/* page */}
          {
            visiblePages.value.map((pageNum) => {
              const isActive = pageNum === props.currentPage
              const isDisabled = pageNum === '...'

              return (
                <button
                  class={`
                    text-base-content text-shadow-base-100/10 hover:bg-base-content/10
                    relative flex h-10
                    w-10 cursor-pointer
                    items-center
                    justify-center rounded-full
                    text-lg transition-all
                    duration-150
                    text-shadow-lg
                    ${isDisabled ? 'hover:text-base-content/70 cursor-not-allowed opacity-30 hover:bg-transparent' : ''}
                    ${isActive ? 'bg-base-content/15 text-base-content/80 border-base-content/10 border font-semibold' : ''}
                  `}
                  disabled={isDisabled}
                  onClick={() => handlePage(pageNum as number)}
                >
                  {pageNum}
                </button>
              )
            })
          }

          {/* next */}
          <button
            class={`
              text-base-content text-shadow-base-100/10 hover:bg-base-content/10
              relative flex h-10
              w-10 cursor-pointer
              items-center
              justify-center rounded-full
              text-lg transition-all
              duration-150
              text-shadow-lg
              ${isLastPage.value ? 'hover:text-base-content/70 cursor-not-allowed opacity-30 hover:bg-transparent' : ''}
            `}
            disabled={isLastPage.value}
            onClick={handleNext}
          >
            »
          </button>
        </div>

        {/* size selector */}
        {
          props.showSizeChanger && (
            <div class="ml-4 flex items-center gap-2">
              <select
                class="
                  bg-base-content/10
                  border-base-content/20
                  text-base-content/80 cursor-pointer
                  appearance-none
                  rounded-xl border
                  px-2
                  py-1
                  text-sm
                  focus:outline-none
                "
                value={props.currentPageSize}
                onChange={handlePageSize}
              >
                {
                  props.pageSizeOptions.map(size => (
                    <option key={size} value={size}>
                      {size}
                      {' '}
                      条
                    </option>
                  ))
                }
              </select>
            </div>
          )
        }
      </div>
    )
  },
})

export default Pagination
