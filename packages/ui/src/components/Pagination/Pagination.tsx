import type {
  ExtractPublicPropTypes,
  PropType,
} from 'vue'
import { computed, defineComponent, ref, watch } from 'vue'
import { Button } from '../Button/Button'

type VisiblePage = number | 'ellipsis'

export type PaginationSize = 'sm' | 'md'

export interface PaginationLabels {
  previousPage: string
  nextPage: string
  jumpToPage: string
  pageSize: string
  pageSizeUnit: string
}

const options = [30, 50, 100, 300, 500, 1000] as const

const props = {
  currentPage: {
    type: Number,
    required: true,
  },
  currentPageSize: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  pageSizeOptions: {
    type: Array as PropType<readonly number[]>,
    default: () => options,
  },
  showSizeChanger: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String as PropType<PaginationSize>,
    default: 'md',
  },
  labels: {
    type: Object as PropType<PaginationLabels>,
    required: true,
  },
  onPageSizeChange: {
    type: Function as PropType<(size: number) => void>,
    required: true,
  },
  onCurrentPageChange: {
    type: Function as PropType<(page: number) => void>,
    required: true,
  },
} as const

export type PaginationProps = ExtractPublicPropTypes<typeof props>

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

/**
 * An application-agnostic controlled pagination navigator. Callers own the
 * current state, localized labels and state-changing callbacks.
 */
export const Pagination = defineComponent({
  name: 'Pagination',

  props,

  setup(props) {
    const jump = ref('')

    watch(() => props.currentPage, () => {
      jump.value = ''
    })

    const count = computed(() => props.currentPageSize > 0
      ? Math.max(1, Math.ceil(Math.max(0, props.total) / props.currentPageSize))
      : 1)
    const first = computed(() => props.currentPage <= 1)
    const last = computed(() => props.currentPage >= count.value)
    const pages = computed<VisiblePage[]>(() => {
      if (count.value <= 7)
        return range(1, count.value)

      if (props.currentPage <= 4)
        return [...range(1, 5), 'ellipsis', count.value]

      if (props.currentPage >= count.value - 3)
        return [1, 'ellipsis', ...range(count.value - 4, count.value)]

      return [
        1,
        'ellipsis',
        ...range(props.currentPage - 1, props.currentPage + 1),
        'ellipsis',
        count.value,
      ]
    })

    function changeSize(event: Event) {
      props.onPageSizeChange(Number((event.target as HTMLSelectElement).value))
    }

    function input(event: Event) {
      jump.value = (event.target as HTMLInputElement).value.replace(/\D/g, '')
    }

    function submit() {
      const page = Number(jump.value)

      if (page < 1 || page > count.value || page === props.currentPage) {
        jump.value = ''
        return
      }

      props.onCurrentPageChange(page)
      jump.value = ''
    }

    function keydown(event: KeyboardEvent) {
      if (event.key === 'Enter')
        submit()
    }

    return () => {
      const small = props.size === 'sm'
      const labels = {
        previousPage: props.labels.previousPage.trim(),
        nextPage: props.labels.nextPage.trim(),
        jumpToPage: props.labels.jumpToPage.trim(),
        pageSize: props.labels.pageSize.trim(),
        pageSizeUnit: props.labels.pageSizeUnit.trim(),
      }

      if (!labels.previousPage || !labels.nextPage || !labels.jumpToPage)
        throw new Error('Pagination requires non-empty navigation labels.')
      if (props.showSizeChanger && !labels.pageSize)
        throw new Error('Pagination requires pageSize label when showSizeChanger is enabled.')

      const jumpInput = (mobile = false) => (
        <input
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          class={[
            'input input-ghost',
            small ? 'input-sm' : 'input-md',
            'text-base-content/70 focus:bg-base-content/10 focus:text-base-content/80',
            'rounded-full px-2 text-center focus:outline-none',
            small ? 'text-xs' : 'text-sm',
            mobile
              ? small ? 'w-20' : 'w-24'
              : small ? 'w-12 px-1' : 'w-14 px-1',
          ]}
          aria-label={labels.jumpToPage}
          placeholder={mobile ? `${props.currentPage}/${count.value}` : '…'}
          value={jump.value}
          onInput={input}
          onKeydown={keydown}
        />
      )

      return (
        <div
          class={[
            'inline-flex items-center leading-none font-semibold whitespace-nowrap',
            small ? 'min-h-8 gap-1 p-0 text-xs' : 'min-h-10 gap-1.5 p-1.5 text-sm',
          ]}
          data-ui-pagination=""
        >
          <div
            class={[
              'drop-shadow-base-200/50 flex items-center gap-1 drop-shadow-sm',
              small ? 'lg:hidden' : 'md:hidden',
            ]}
          >
            <Button
              variant="ghost"
              size={props.size}
              shape="circle"
              class={small ? 'text-base' : 'text-lg'}
              disabled={first.value}
              aria-label={labels.previousPage}
              onClick={() => props.onCurrentPageChange(props.currentPage - 1)}
            >
              «
            </Button>

            {jumpInput(true)}

            <Button
              variant="ghost"
              size={props.size}
              shape="circle"
              class={small ? 'text-base' : 'text-lg'}
              disabled={last.value}
              aria-label={labels.nextPage}
              onClick={() => props.onCurrentPageChange(props.currentPage + 1)}
            >
              »
            </Button>
          </div>

          <div
            class={[
              'drop-shadow-base-200/50 hidden items-center gap-1 drop-shadow-sm',
              small ? 'lg:flex' : 'md:flex',
            ]}
          >
            <Button
              variant="ghost"
              size={props.size}
              shape="circle"
              class={small ? 'text-base' : 'text-lg'}
              disabled={first.value}
              aria-label={labels.previousPage}
              onClick={() => props.onCurrentPageChange(props.currentPage - 1)}
            >
              «
            </Button>

            {pages.value.map((page, index) => {
              if (page === 'ellipsis') {
                const lastEllipsis = pages.value.lastIndexOf('ellipsis') === index

                return lastEllipsis
                  ? jumpInput()
                  : (
                      <span class={['flex items-center justify-center', small ? 'size-8' : 'size-12']} aria-hidden="true">
                        …
                      </span>
                    )
              }

              const active = page === props.currentPage

              return (
                <Button
                  variant={active ? 'glass-inset' : 'ghost'}
                  size={props.size}
                  shape="circle"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => props.onCurrentPageChange(page)}
                >
                  {page}
                </Button>
              )
            })}

            <Button
              variant="ghost"
              size={props.size}
              shape="circle"
              class={small ? 'text-base' : 'text-lg'}
              disabled={last.value}
              aria-label={labels.nextPage}
              onClick={() => props.onCurrentPageChange(props.currentPage + 1)}
            >
              »
            </Button>
          </div>

          {props.showSizeChanger && (
            <div
              class={[
                small ? 'ml-3 gap-1.5 lg:flex' : 'ml-4 gap-2 md:flex',
                'hidden items-center',
              ]}
            >
              <select
                class={[
                  'select select-ghost text-base-content/80 cursor-pointer rounded-xl focus:outline-none',
                  small ? 'select-xs' : 'select-sm',
                ]}
                aria-label={labels.pageSize}
                value={props.currentPageSize}
                onChange={changeSize}
              >
                {props.pageSizeOptions.map(size => (
                  <option key={size} value={size}>
                    {size}
                    {labels.pageSizeUnit && ` ${labels.pageSizeUnit}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )
    }
  },
})
