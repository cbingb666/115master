import type { PropType } from 'vue'
import { computed, defineComponent } from 'vue'
import { PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants'
import { clsx } from '@/utils/clsx'
/** 可见页码项类型 */

type VisiblePageItem = number | '...'

const styles = clsx({
  // 容器
  container: [
    'inline-flex items-center',
    'px-3 py-2',
    'bg-base-200/70',
    'rounded-3xl',
    'liquid-glass',
    'before:backdrop-blur-xl',
    'before:rounded-3xl',
    'after:rounded-3xl',
    'shadow-xl',
    'shadow-base-100/50',
  ],
  // 页面大小选择器
  sizeSelector: {
    container: [
      'flex items-center gap-2 ml-4',
    ],
    select: [
      'appearance-none',
      'bg-base-content/10',
      'border border-base-content/20',
      'rounded-xl',
      'px-2 py-1',
      'text-sm',
      'text-base-content/80',
      'cursor-pointer',
      'focus:outline-none',
    ],
  },
  // 按钮组
  buttonGroup: [
    'flex items-center gap-1',
  ],
  // 按钮样式
  button: {
    base: [
      'relative',
      'w-10 h-10',
      'flex items-center justify-center',
      'text-base-content',
      'text-lg',
      'rounded-full',
      'text-shadow-lg',
      'text-shadow-base-100/10',
      'transition-all duration-150',
      'hover:bg-base-content/10',
      'cursor-pointer',
    ],
    active: [
      'bg-base-content/15',
      'text-base-content/80',
      'font-semibold',
      'border-base-content/10',
    ],
    disabled: [
      'opacity-30',
      'cursor-not-allowed',
      'hover:bg-transparent',
      'hover:text-base-content/70',
    ],
  },
})

/**
 * 分页
 */
export default defineComponent({
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
    /** 是否是第一页 */
    const isFirstPage = computed(() => {
      return props.currentPage === 1
    })

    /** 是否是最后一页 */
    const isLastPage = computed(() => {
      return props.currentPage === Math.ceil(props.total / props.currentPageSize)
    })

    /** 总页数 */
    const pageCount = computed(() => {
      return Math.ceil(props.total / props.currentPageSize)
    })

    /** 计算可见的页码 */
    const visiblePages = computed<VisiblePageItem[]>(() => {
      const current = props.currentPage
      const total = pageCount.value
      const visible: VisiblePageItem[] = []

      if (total <= 7) {
        // 总页数少于等于7页，显示所有页码
        for (let i = 1; i <= total; i++) {
          visible.push(i)
        }
      }
      else {
        // 总页数大于7页，显示省略号
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
      <div class={styles.container}>
        <div class={styles.buttonGroup}>
          {/* prev */}
          <button
            class={[
              styles.button.base,
              isFirstPage.value && styles.button.disabled,
            ]}
            disabled={isFirstPage.value}
            onClick={handlePrev}
          >
            «
          </button>

          {/* page */}
          {
            visiblePages.value.map(pageNum => (
              <button
                class={[
                  styles.button.base,
                  pageNum === '...' && styles.button.disabled,
                  pageNum === props.currentPage && styles.button.active,
                ]}
                disabled={pageNum === '...'}
                onClick={() => handlePage(pageNum as number)}
              >
                {pageNum}
              </button>
            ))
          }

          {/* next */}
          <button
            class={[
              styles.button.base,
              isLastPage.value && styles.button.disabled,
            ]}
            disabled={isLastPage.value}
            onClick={handleNext}
          >
            »
          </button>
        </div>

        {/* size selector */}
        {
          props.showSizeChanger && (
            <div class={styles.sizeSelector.container}>
              <select
                class={styles.sizeSelector.select}
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
