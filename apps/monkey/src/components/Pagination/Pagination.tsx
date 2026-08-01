import type { PillVariant } from '@115master/ui'
import type { PropType } from 'vue'
import { Button, Pill } from '@115master/ui'
import { computed, defineComponent, ref, watch } from 'vue'
import { PAGINATION_DEFAULT_PAGE_SIZE_OPTIONS } from '@/constants'

type VisiblePageItem = number | '...'
export type PaginationSurface = 'plain' | 'floating'

const SURFACES: Record<PaginationSurface, PillVariant> = {
  plain: 'plain',
  floating: 'glass-floating',
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

const Pagination = defineComponent({
  name: 'Pagination',
  props: {
    /**
     * 分页器承载场景
     * @default 'plain'
     */
    surface: {
      type: String as PropType<PaginationSurface>,
      default: 'plain',
    },
    /** Glass 材质由外层容器承载 */
    embedded: {
      type: Boolean,
      default: false,
    },
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
    const jumpValue = ref('')

    watch(() => props.currentPage, () => {
      jumpValue.value = ''
    })

    const pageCount = computed(() => {
      return Math.ceil(props.total / props.currentPageSize)
    })

    const isFirstPage = computed(() => {
      return props.currentPage === 1
    })

    const isLastPage = computed(() => {
      return props.currentPage === pageCount.value
    })

    const visiblePages = computed<VisiblePageItem[]>(() => {
      const current = props.currentPage
      const total = pageCount.value

      if (total <= 7)
        return range(1, total)

      if (current <= 4)
        return [...range(1, 5), '...', total]

      if (current >= total - 3)
        return [1, '...', ...range(total - 4, total)]

      return [1, '...', ...range(current - 1, current + 1), '...', total]
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
      props.onPageSizeChange(Number((event.target as HTMLSelectElement).value))
    }

    /** 执行跳转 */
    function handleJump() {
      const page = Number(jumpValue.value)
      if (page < 1 || page > pageCount.value || page === props.currentPage) {
        jumpValue.value = ''
        return
      }
      props.onCurrentPageChange(page)
      jumpValue.value = ''
    }

    /** 处理输入 */
    function handleJumpInput(event: Event) {
      const value = (event.target as HTMLInputElement).value.replace(/\D/g, '')
      jumpValue.value = value
    }

    /** 回车跳转 */
    function handleJumpKeydown(event: KeyboardEvent) {
      if (event.key === 'Enter')
        handleJump()
    }

    return () => (
      <Pill
        as="div"
        variant={props.embedded ? 'plain' : SURFACES[props.surface]}
        size="md"
        class="h-auto items-center px-3 py-1.5"
      >
        {/* Mobile: simplified pagination — prev, current page, jump input, next */}
        <div class="drop-shadow-base-200/50 flex items-center gap-1 drop-shadow-sm md:hidden">
          <Button
            variant="ghost"
            size="md"
            shape="circle"
            class="text-lg"
            disabled={isFirstPage.value}
            aria-label="上一页"
            onClick={handlePrev}
          >
            «
          </Button>

          <input
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            class="
              input input-ghost input-md
              text-base-content/60
              focus:bg-base-content/10 focus:text-base-content/80
              w-24 rounded-full px-2
              text-center text-sm
              focus:outline-none
            "
            placeholder={`${props.currentPage}/${pageCount.value}`}
            min={1}
            max={pageCount.value}
            value={jumpValue.value}
            onInput={handleJumpInput}
            onKeydown={handleJumpKeydown}
          />

          <Button
            variant="ghost"
            size="md"
            shape="circle"
            class="text-lg"
            disabled={isLastPage.value}
            aria-label="下一页"
            onClick={handleNext}
          >
            »
          </Button>
        </div>

        {/* Desktop: full pagination — prev, page buttons, jump input, next */}
        <div class="drop-shadow-base-200/50 hidden items-center gap-1 drop-shadow-sm md:flex">
          <Button
            variant="ghost"
            size="md"
            shape="circle"
            class="text-lg"
            disabled={isFirstPage.value}
            aria-label="上一页"
            onClick={handlePrev}
          >
            «
          </Button>

          {
            visiblePages.value.map((pageNum, index) => {
              const lastEllipsisIndex = visiblePages.value.lastIndexOf('...')

              if (pageNum === '...' && lastEllipsisIndex === index) {
                return (
                  <input
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    class="
                      input input-ghost input-md
                      text-base-content/60
                      focus:bg-base-content/10 focus:text-base-content/80
                      w-14 rounded-full px-1
                      text-center text-sm
                      focus:outline-none
                    "
                    placeholder="..."
                    min={1}
                    max={pageCount.value}
                    value={jumpValue.value}
                    onInput={handleJumpInput}
                    onKeydown={handleJumpKeydown}
                  />
                )
              }

              if (pageNum === '...') {
                return (
                  <Button
                    variant="ghost"
                    size="md"
                    shape="circle"
                    onClick={() => handlePage(props.currentPage)}
                  >
                    {pageNum}
                  </Button>
                )
              }

              const isActive = pageNum === props.currentPage
              const activeVariant = props.surface === 'floating' ? 'glass-inset' : 'soft'
              return (
                <Button
                  variant={isActive ? activeVariant : 'ghost'}
                  size="md"
                  shape="circle"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => handlePage(pageNum)}
                >
                  {pageNum}
                </Button>
              )
            })
          }

          <Button
            variant="ghost"
            size="md"
            shape="circle"
            class="text-lg"
            disabled={isLastPage.value}
            aria-label="下一页"
            onClick={handleNext}
          >
            »
          </Button>
        </div>

        {/* size selector */}
        {
          props.showSizeChanger && (
            <div class="ml-4 hidden items-center gap-2 md:flex">
              <select
                class="
                  select select-ghost select-sm
                  text-base-content/80 cursor-pointer rounded-xl
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
      </Pill>
    )
  },
})

export default Pagination
