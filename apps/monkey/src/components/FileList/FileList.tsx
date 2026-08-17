import type { Share } from '@115master/drive115'
import type { Range } from '@tanstack/vue-virtual'
import type { MaybeElement } from '@vueuse/core'
import type { PropType, SlotsType, VNodeChild } from 'vue'
import { Progress, StatusFeedback } from '@115master/ui'
import { defaultRangeExtractor, useVirtualizer, useWindowVirtualizer } from '@tanstack/vue-virtual'
import { breakpointsTailwind, unrefElement, useBreakpoints, useEventListener, useResizeObserver, useThrottleFn } from '@vueuse/core'
import {
  computed,
  defineComponent,
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  shallowRef,
  watch,
} from 'vue'
import { errorFeedback } from '@/utils/errorFeedback'
import { getFilesItemId } from '@/utils/filesItem'
import Empty from '../Empty/Empty'
import { group, locate } from './layout'

interface Position {
  id: string
  offset: number
}

const positions = new Map<string, Position>()
const POSITION_LIMIT = 100

const FileList = defineComponent({
  name: 'FileList',
  props: {
    items: {
      type: Array as PropType<Share.Entity.FilesItem[]>,
      default: () => [],
    },
    viewType: {
      type: String as PropType<'card' | 'list'>,
      default: 'list',
    },
    getScrollElement: {
      type: Function as PropType<() => HTMLElement | undefined>,
      default: undefined,
    },
    positionKey: {
      type: String,
      default: '',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    refreshing: {
      type: Boolean,
      default: false,
    },
    infinite: {
      type: Boolean,
      default: false,
    },
    hasMore: {
      type: Boolean,
      default: false,
    },
    loadingMore: {
      type: Boolean,
      default: false,
    },
    loadMoreError: {
      type: Object as PropType<Error | string | null>,
      default: null,
    },
    onLoadMore: {
      type: Function as PropType<() => void | Promise<unknown>>,
      default: () => {},
    },
    error: {
      type: Object as PropType<Error | string | null>,
      default: null,
    },
    empty: {
      type: Boolean,
      default: false,
    },
    emptyDescription: {
      type: String,
      default: '空文件夹',
    },
  },
  slots: Object as SlotsType<{
    item: (props: { item: Share.Entity.FilesItem, index: number }) => VNodeChild
    overlay: () => VNodeChild
  }>,
  setup: (props, { slots }) => {
    const track = ref<HTMLElement>()
    const sentinel = ref<HTMLElement>()
    const margin = shallowRef(0)
    const focus = shallowRef<number>()
    const pending = shallowRef('')
    const breakpoints = useBreakpoints(breakpointsTailwind)
    const sm = breakpoints.greaterOrEqual('sm')
    const xxl = breakpoints.greaterOrEqual('2xl')
    const columns = computed(() => props.viewType === 'list' ? 1 : xxl.value ? 5 : sm.value ? 4 : 2)
    const gap = computed(() => props.viewType === 'list' ? 4 : sm.value ? 20 : 12)
    const rows = computed(() => group(props.items, columns.value))
    let restoring = false
    let frame = 0

    function key(index: number) {
      const item = rows.value[index]?.[0]
      return item ? `${columns.value}:${getFilesItemId(item)}` : `${columns.value}:${index}`
    }

    function range(value: Range) {
      const indexes = defaultRangeExtractor(value)
      if (focus.value === undefined)
        return indexes
      const index = Math.floor(focus.value / columns.value)
      if (indexes.includes(index))
        return indexes
      return [...indexes, index].sort((a, b) => a - b)
    }

    function updateMargin() {
      if (!track.value)
        return
      const scroll = props.getScrollElement?.()
      if (!scroll) {
        margin.value = track.value.getBoundingClientRect().top + window.scrollY
        return
      }
      margin.value = track.value.getBoundingClientRect().top
        - scroll.getBoundingClientRect().top
        + scroll.scrollTop
        - scroll.clientTop
    }

    const options = computed(() => ({
      count: rows.value.length,
      estimateSize: () => props.viewType === 'list' ? 64 : 320,
      gap: gap.value,
      getItemKey: key,
      overscan: props.viewType === 'list' ? 8 : 3,
      rangeExtractor: range,
      scrollMargin: margin.value,
    }))
    const windowList = useWindowVirtualizer<HTMLElement>(computed(() => ({
      ...options.value,
      enabled: props.getScrollElement === undefined,
    })))
    const elementList = useVirtualizer<HTMLElement, HTMLElement>(computed(() => ({
      ...options.value,
      enabled: props.getScrollElement !== undefined,
      getScrollElement: () => props.getScrollElement?.() ?? null,
    })))
    const virtualizer = () => props.getScrollElement ? elementList.value : windowList.value

    function offset() {
      return props.getScrollElement?.()?.scrollTop ?? window.scrollY
    }

    function save(positionKey = props.positionKey) {
      if (!positionKey || props.items.length === 0)
        return
      const top = virtualizer().scrollOffset ?? offset()
      const row = virtualizer().getVirtualItemForOffset(top)
      const item = row && props.items[row.index * columns.value]
      if (!row || !item)
        return
      positions.delete(positionKey)
      positions.set(positionKey, {
        id: getFilesItemId(item),
        offset: top - row.start,
      })
      if (positions.size <= POSITION_LIMIT)
        return
      const oldest = positions.keys().next().value
      if (oldest !== undefined)
        positions.delete(oldest)
    }

    function start() {
      const scroll = props.getScrollElement?.()
      if (scroll) {
        scroll.scrollTo({ top: 0, behavior: 'auto' })
        return
      }
      window.scrollTo({ top: 0, behavior: 'auto' })
    }

    async function restore(positionKey = props.positionKey) {
      if (!positionKey || props.loading || rows.value.length === 0)
        return
      const current = ++frame
      await nextTick()
      if (current !== frame || positionKey !== props.positionKey || props.loading)
        return
      updateMargin()
      await nextTick()
      const position = positions.get(positionKey)
      if (!position) {
        start()
        pending.value = ''
        return
      }
      const index = locate(props.items, position.id, columns.value)
      if (index < 0) {
        start()
        pending.value = ''
        return
      }
      restoring = true
      virtualizer().scrollToIndex(index, { align: 'start', behavior: 'auto' })
      requestAnimationFrame(() => {
        if (current === frame)
          virtualizer().scrollBy(position.offset, { behavior: 'auto' })
        restoring = false
      })
      pending.value = ''
    }

    watch(() => props.positionKey, (value, previous) => {
      if (previous)
        save(previous)
      pending.value = value
      void nextTick(() => {
        if (!props.loading && pending.value === value)
          void restore(value)
      })
    }, { immediate: true, flush: 'pre' })
    watch(() => props.loading, (value, previous) => {
      if (value && !previous) {
        if (!pending.value)
          save()
        pending.value = props.positionKey
        return
      }
      if (!value && pending.value)
        void restore(pending.value)
    }, { flush: 'pre' })
    watch([() => props.viewType, columns], () => {
      virtualizer().measure()
      pending.value = props.positionKey
      void restore(props.positionKey)
    }, { flush: 'post' })

    function checkMore() {
      if (!props.infinite || !props.hasMore || props.loading || props.loadingMore || props.loadMoreError || !sentinel.value)
        return
      const scroll = props.getScrollElement?.()
      const bottom = scroll?.getBoundingClientRect().bottom ?? window.innerHeight
      if (sentinel.value.getBoundingClientRect().top <= bottom + 480)
        void props.onLoadMore()
    }

    onMounted(() => void nextTick(() => {
      updateMargin()
      checkMore()
    }))
    onActivated(() => {
      pending.value = props.positionKey
      void restore(props.positionKey)
    })
    onDeactivated(() => save())
    onBeforeUnmount(() => {
      frame++
      save()
    })
    useResizeObserver(track, updateMargin)
    useEventListener(window, 'resize', updateMargin)
    const handleScroll = useThrottleFn(() => {
      if (!props.loading && !restoring)
        save()
      checkMore()
    }, 50)
    useEventListener(window, 'scroll', () => {
      if (!props.getScrollElement)
        handleScroll()
    }, { passive: true })
    useEventListener(() => props.getScrollElement?.(), 'scroll', handleScroll, { passive: true })
    watch(
      [() => props.items.length, () => props.loadingMore, () => props.hasMore, () => props.infinite],
      () => void nextTick(checkMore),
      { flush: 'post' },
    )

    function handleFocusin(event: FocusEvent) {
      const item = (event.target as HTMLElement).closest<HTMLElement>('[data-file-list-index]')
      if (item)
        focus.value = Number(item.dataset.fileListIndex)
    }

    function handleFocusout(event: FocusEvent) {
      if ((event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
        return
      focus.value = undefined
    }

    return () => (
      <div class="relative min-h-full w-full" data-view-type={props.viewType}>
        {props.error && (
          <StatusFeedback
            class="absolute inset-0 m-auto"
            status="error"
            size="xs"
            padded={false}
            {...errorFeedback(props.error)}
          />
        )}

        {!props.error && <Progress active={props.loading || props.refreshing} />}

        {!props.error && !props.loading && props.empty && (
          <div class="absolute inset-0 flex justify-center pt-30">
            <Empty
              description={props.emptyDescription}
              size="xl"
            />
          </div>
        )}

        {!props.error && !props.loading && !props.empty && (
          <div
            aria-label="文件列表"
            class="relative min-h-full w-full focus-within:outline-none"
            data-file-list-total={props.items.length}
            data-view-type={props.viewType}
            role="list"
            tabindex="0"
            onFocusin={handleFocusin}
            onFocusout={handleFocusout}
          >
            <div
              ref={track}
              class="relative w-full"
              style={{ height: `${virtualizer().getTotalSize()}px` }}
            >
              {virtualizer().getVirtualItems().map(row => (
                <div
                  key={String(row.key)}
                  ref={value => virtualizer().measureElement(
                    (unrefElement(value as MaybeElement) as HTMLElement | null | undefined) ?? null,
                  )}
                  class="absolute top-0 left-0 grid w-full items-stretch"
                  data-index={row.index}
                  style={{
                    columnGap: `${gap.value}px`,
                    gridTemplateColumns: `repeat(${columns.value}, minmax(0, 1fr))`,
                    transform: `translateY(${row.start - margin.value}px)`,
                  }}
                >
                  {rows.value[row.index]?.map((item, column) => slots.item?.({
                    item,
                    index: row.index * columns.value + column,
                  }))}
                </div>
              ))}
            </div>
            {slots.overlay?.()}
          </div>
        )}

        {!props.error && !props.loading && !props.empty && props.infinite && (
          <div
            ref={sentinel}
            aria-live="polite"
            class="text-base-content/50 flex h-16 items-center justify-center text-xs"
            data-file-list-sentinel
          >
            {props.loadingMore && (
              <span class="flex items-center gap-2">
                <span class="loading loading-spinner loading-sm" aria-hidden="true" />
                正在加载更多
              </span>
            )}
            {props.loadMoreError && (
              <button
                type="button"
                class="btn btn-ghost btn-sm"
                onClick={() => props.onLoadMore()}
              >
                加载失败，点击重试
              </button>
            )}
            {!props.hasMore && !props.loadingMore && !props.loadMoreError && `已加载全部 ${props.items.length} 项`}
          </div>
        )}
      </div>
    )
  },
})

export default FileList
