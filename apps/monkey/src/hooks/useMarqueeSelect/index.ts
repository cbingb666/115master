import { useEventListener, useMagicKeys, useThrottleFn } from '@vueuse/core'
import { computed, onUnmounted, shallowRef, watchEffect } from 'vue'

const EDGE = 48
const SPEED = 12

export interface UseMarqueeSelectOptions {
  /** 容器元素 */
  container?: HTMLElement | (() => HTMLElement | undefined)
  /** 项目唯一标识 */
  itemKey?: string
  /** 框选边缘自动滚动使用的真实滚动容器，缺省使用容器元素 */
  scrollContainer?: HTMLElement | (() => HTMLElement | undefined)
  /** 是否禁用框选 */
  disabled?: boolean
  /** 选择框的样式类名 */
  selectionBoxClass?: string
  /** 最小拖拽距离 */
  minDistance?: number
}

interface Item {
  node: HTMLElement
  checkbox: HTMLInputElement
}

interface Point {
  x: number
  y: number
}

export function useMarqueeSelect(options: UseMarqueeSelectOptions = {}) {
  const {
    container,
    scrollContainer,
    itemKey = 'data-selection-key',
    disabled = false,
    selectionBoxClass = 'marquee-selection-box',
    minDistance = 10,
  } = options

  const THROTTLE_TIME = 1000 / 120
  const isSelecting = shallowRef(false)
  const pressed = shallowRef(false)
  const startPoint = shallowRef<Point>({ x: 0, y: 0 })
  const endPoint = shallowRef<Point>({ x: 0, y: 0 })
  const selectionBox = shallowRef<HTMLElement | null>(null)
  const containerElement = shallowRef<HTMLElement | null>(null)
  const scrollElement = shallowRef<HTMLElement | null>(null)
  const originalUserSelect = shallowRef<string>('')
  const pointer: Point = { x: 0, y: 0 }
  let frame = 0

  /** 快捷键 */
  const { shift, meta } = useMagicKeys()

  /** 计算选择框的位置和大小 */
  const selectionRect = computed(() => {
    const start = startPoint.value
    const end = endPoint.value

    const left = Math.min(start.x, end.x)
    const top = Math.min(start.y, end.y)

    const width = Math.abs(end.x - start.x)
    const height = Math.abs(end.y - start.y)

    return { left, top, width, height }
  })

  /** 获取容器元素 */
  const getContainer = () => {
    if (typeof container === 'function') {
      return container()
    }
    return container || null
  }

  const getScrollContainer = () => {
    if (typeof scrollContainer === 'function')
      return scrollContainer()
    return scrollContainer || getContainer()
  }

  /** 将视口坐标转换为框选容器的内容坐标 */
  const getPoint = (x: number, y: number): Point => {
    const containerEl = containerElement.value
    if (!containerEl)
      return { x, y }
    const rect = containerEl.getBoundingClientRect()
    return {
      x: x - rect.left + containerEl.scrollLeft,
      y: y - rect.top + containerEl.scrollTop,
    }
  }

  /** 检测元素是否与选择框相交 */
  const isElementIntersecting = (item: Item) => {
    const containerEl = containerElement.value
    if (!containerEl)
      return false

    const elementRect = item.node.getBoundingClientRect()
    const bounds = containerEl.getBoundingClientRect()
    const selection = selectionRect.value

    /** 将元素位置转换为相对于容器的坐标 */
    const elementRelative = {
      left: elementRect.left - bounds.left + containerEl.scrollLeft,
      top: elementRect.top - bounds.top + containerEl.scrollTop,
      right: elementRect.right - bounds.left + containerEl.scrollLeft,
      bottom: elementRect.bottom - bounds.top + containerEl.scrollTop,
    }

    // 检测相交
    return !(
      selection.left > elementRelative.right
      || selection.left + selection.width < elementRelative.left
      || selection.top > elementRelative.bottom
      || selection.top + selection.height < elementRelative.top
    )
  }

  /** 设置项目复选框状态 */
  const setItemInputCheckbox = (item: Item, checked: boolean) => {
    if (item.checkbox.checked !== checked) {
      item.checkbox.click()
    }
  }

  /** 获取可选择 */
  const getSelectableItems = (): Item[] => {
    const containerEl = containerElement.value

    if (!containerEl)
      return []

    const nodes = Array.from(
      containerEl.querySelectorAll<HTMLElement>(
        `[${itemKey}]`,
      ),
    )

    return nodes.flatMap((node) => {
      const checkbox = node.querySelector<HTMLInputElement>('input[type="checkbox"]')
      return checkbox ? [{ node, checkbox }] : []
    })
  }

  /** 更新选中的项目 */
  const updateSelectedItems = () => {
    if (!isSelecting.value)
      return

    const containerEl = containerElement.value
    if (!containerEl)
      return

    getSelectableItems().forEach((item) => {
      if (isElementIntersecting(item)) {
        setItemInputCheckbox(item, true)
      }
      else if (!shift.value && !meta.value) {
        setItemInputCheckbox(item, false)
      }
    })
  }

  /** 创建选择框元素 */
  const createSelectionBox = () => {
    const box = document.createElement('div')
    box.className = selectionBoxClass
    box.style.cssText = `
      position: absolute;
      border: 2px solid var(--color-primary);
      background-color: color-mix(in oklab, var(--color-primary) 10%, transparent);
      pointer-events: none;
      z-index: var(--ui-z-raised);
      display: none;
    `
    return box
  }

  /** 更新选择框位置 */
  const updateSelectionBox = () => {
    if (!selectionBox.value)
      return

    const rect = selectionRect.value
    const box = selectionBox.value

    if (rect.width < minDistance && rect.height < minDistance) {
      box.style.display = 'none'
      return
    }

    box.style.display = 'block'
    box.style.left = `${rect.left}px`
    box.style.top = `${rect.top}px`
    box.style.width = `${rect.width}px`
    box.style.height = `${rect.height}px`
  }

  /** 结束框选 */
  const endSelection = () => {
    if (!isSelecting.value)
      return

    isSelecting.value = false
    cancelAnimationFrame(frame)
    frame = 0

    // 恢复用户选择样式
    if (containerElement.value) {
      containerElement.value.style.userSelect = originalUserSelect.value
    }

    // 隐藏选择框
    if (selectionBox.value) {
      selectionBox.value.style.display = 'none'
    }
  }

  /** 更新框选 */
  const updateSelection = () => {
    if (!containerElement.value)
      return
    updateSelectionBox()
    updateSelectedItems()
  }

  /** 指针停在滚动容器边缘时逐帧滚动，并持续吸纳虚拟列表新挂载的项目 */
  const scroll = () => {
    if (!isSelecting.value)
      return

    const scrollEl = scrollElement.value
    if (scrollEl) {
      const root = scrollEl === document.documentElement || scrollEl === document.body
      const rect = root ? null : scrollEl.getBoundingClientRect()
      const top = root ? 0 : Math.max(0, rect!.top)
      const bottom = root ? window.innerHeight : Math.min(window.innerHeight, rect!.bottom)
      const above = pointer.y < top + EDGE
      const below = pointer.y > bottom - EDGE

      if (bottom > top && (above || below)) {
        const ratio = above
          ? (top + EDGE - pointer.y) / EDGE
          : (pointer.y - bottom + EDGE) / EDGE
        const distance = Math.ceil(SPEED * Math.min(1, Math.max(0, ratio)))
        scrollEl.scrollBy({ behavior: 'auto', top: distance * (above ? -1 : 1) })
        endPoint.value = getPoint(pointer.x, pointer.y)
        updateSelection()
      }
    }

    frame = requestAnimationFrame(scroll)
  }

  const onMouseDown = (event: MouseEvent) => {
    if (disabled)
      return

    // 只处理左键
    if (event.button !== 0)
      return

    /**
     * 落在交互控件上不启动框选（按钮/输入框/checkbox 等）。
     * 注意：不要把 `a` / `[draggable="true"]` 加进来——
     * FileItem 用 <Link>（渲染为 <a>）包裹文件名/缩略图/内容，会覆盖卡片大部分面积；
     * 缩略图的 mousedown 已在 FileItem 内 stopPropagation，避免 Pointer DnD 与框选竞争；
     * Link 的 <a> 也显式设为 draggable=false，不会触发原生拖拽。
     */
    const target = event.target as HTMLElement | null
    if (target?.closest('input, textarea, select, button, label, [contenteditable]'))
      return

    const x = event.clientX
    const y = event.clientY
    pointer.x = x
    pointer.y = y
    pressed.value = true
    startPoint.value = getPoint(x, y)
    endPoint.value = startPoint.value

    // 保存原始用户选择样式
    if (containerElement.value) {
      originalUserSelect.value = containerElement.value.style.userSelect || ''
    }
  }

  const onMouseMove = useThrottleFn((event: MouseEvent) => {
    if (!pressed.value)
      return

    pointer.x = event.clientX
    pointer.y = event.clientY
    endPoint.value = getPoint(pointer.x, pointer.y)

    if (
      Math.abs(startPoint.value.x - endPoint.value.x) < minDistance
      && Math.abs(startPoint.value.y - endPoint.value.y) < minDistance
    ) {
      return
    }

    if (!isSelecting.value) {
      isSelecting.value = true
      frame = requestAnimationFrame(scroll)
    }

    // 禁用用户选择
    if (containerElement.value) {
      containerElement.value.style.userSelect = 'none'
    }

    updateSelection()
  }, THROTTLE_TIME)

  const onMouseUp = () => {
    pressed.value = false
    if (!isSelecting.value) {
      return
    }
    endSelection()
  }

  const onScroll = useThrottleFn(() => {
    if (!isSelecting.value)
      return

    endPoint.value = getPoint(pointer.x, pointer.y)

    updateSelection()
  }, THROTTLE_TIME)

  watchEffect(() => {
    const containerEl = getContainer()
    if (!containerEl)
      return

    containerElement.value = containerEl
    scrollElement.value = getScrollContainer() ?? null

    // 创建选择框
    if (!selectionBox.value) {
      selectionBox.value = createSelectionBox()
    }
    if (!containerEl.contains(selectionBox.value)) {
      containerEl.appendChild(selectionBox.value)
    }
  })

  onUnmounted(() => {
    pressed.value = false
    endSelection()
    cancelAnimationFrame(frame)
    if (selectionBox.value && selectionBox.value.parentNode) {
      selectionBox.value.parentNode.removeChild(selectionBox.value)
    }
  })

  // 使用 useEventListener 替代手动添加事件监听器
  useEventListener(containerElement, 'mousedown', onMouseDown, {
  })
  useEventListener(containerElement, 'mousemove', onMouseMove, {
  })
  useEventListener(document, 'mouseup', onMouseUp, {
  })
  useEventListener(scrollElement, 'scroll', onScroll)
  useEventListener(document, 'scroll', onScroll)

  return {
    // 状态
    isSelecting: computed(() => isSelecting.value),
    selectionRect: computed(() => selectionRect.value),
  }
}
