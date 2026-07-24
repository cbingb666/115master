import type { PropType, SlotsType, VNodeChild } from 'vue'
import { useElementHover, useTimeoutFn } from '@vueuse/core'
import { computed, defineComponent, nextTick, onMounted, shallowRef, watch } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

const DEFAULT_BUTTON_WIDTH_FALLBACK = 40
const DELAY_MS = 60

/**
 * 播放器可展开控制组。悬停时按指定方向展示附加控制，弹窗打开时保持展开。
 */
const ExpandableControlGroup = defineComponent({
  name: 'ExpandableControlGroup',

  props: {
    direction: {
      type: String as PropType<'left' | 'right'>,
      default: 'right',
    },
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    expanded?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    const styles = computed(() => clsx({
      root: [
        'flex items-center',
        props.direction === 'left' ? 'justify-start' : 'justify-end',
        'w-10',
        'group/control',
        'transition-[width] duration-300 ease-[var(--app-ease-in-out-expo)]',
      ],
      expandedContent: [
        'flex items-center gap-1',
        'overflow-hidden',
        'opacity-0',
        'w-0',
        'transition-[opacity,width,margin] duration-300 ease-[var(--app-ease-in-out-expo)]',
        'group-data-[expanded="true"]/control:opacity-100',
      ],
      defaultContent: [
        'flex-shrink-0',
      ],
    }))

    const { popupManager } = usePlayerContext()
    const root = shallowRef<HTMLElement>()
    const defaultContent = shallowRef<HTMLElement>()
    const expandedContent = shallowRef<HTMLElement>()
    const expanded = shallowRef(false)
    const hovered = useElementHover(root)
    const measuredWidth = shallowRef(0)
    const hasOpenPopup = computed(() => popupManager?.hasOpenPopup.value ?? false)

    function getGap(element: HTMLElement) {
      const gap = window.getComputedStyle(element).gap
      if (gap === 'normal')
        return 0
      return Number.parseFloat(gap)
    }

    function getExpandedWidth() {
      if (!expandedContent.value)
        return 0

      const children = Array.from(expandedContent.value.children) as HTMLElement[]
      if (children.length === 0)
        return 0

      const width = expandedContent.value.style.width
      const position = expandedContent.value.style.position

      expandedContent.value.style.position = 'absolute'
      expandedContent.value.style.width = 'auto'

      const childrenWidth = children.reduce((sum, child) => sum + child.offsetWidth, 0)

      expandedContent.value.style.width = width
      expandedContent.value.style.position = position

      return childrenWidth + getGap(expandedContent.value) * (children.length - 1)
    }

    function getDefaultWidth() {
      const child = defaultContent.value?.children[0] as HTMLElement | undefined
      return child?.offsetWidth ?? DEFAULT_BUTTON_WIDTH_FALLBACK
    }

    async function measure() {
      await nextTick()
      measuredWidth.value = getExpandedWidth()
    }

    const width = computed(() => {
      const element = expandedContent.value || root.value
      return Math.ceil(
        getDefaultWidth()
        + measuredWidth.value
        + (element ? getGap(element) : 0),
      )
    })

    const expandTimer = useTimeoutFn(async () => {
      await measure()
      expanded.value = true
    }, DELAY_MS)

    const foldTimer = useTimeoutFn(() => {
      if (!hasOpenPopup.value)
        expanded.value = false
    }, DELAY_MS)

    onMounted(measure)

    watch(hovered, (value) => {
      if (value) {
        foldTimer.stop()
        expandTimer.start()
        return
      }
      expandTimer.stop()
      foldTimer.start()
    })

    watch(hasOpenPopup, (isOpen, wasOpen) => {
      if (isOpen) {
        foldTimer.stop()
        return
      }
      if (wasOpen && !hovered.value)
        foldTimer.start()
    })

    function renderDefault() {
      return (
        <div ref={defaultContent} class={styles.value.defaultContent}>
          {slots.default?.()}
        </div>
      )
    }

    function renderExpanded() {
      return (
        <div
          ref={expandedContent}
          class={styles.value.expandedContent}
          style={{ width: expanded.value ? `${measuredWidth.value}px` : undefined }}
        >
          {slots.expanded?.()}
        </div>
      )
    }

    return () => (
      <div
        ref={root}
        class={styles.value.root}
        style={{ width: expanded.value ? `${width.value}px` : undefined }}
        data-expanded={expanded.value}
        data-direction={props.direction}
      >
        {
          props.direction === 'left'
            ? (
                <>
                  {renderDefault()}
                  {renderExpanded()}
                </>
              )
            : (
                <>
                  {renderExpanded()}
                  {renderDefault()}
                </>
              )
        }
      </div>
    )
  },
})

export default ExpandableControlGroup
