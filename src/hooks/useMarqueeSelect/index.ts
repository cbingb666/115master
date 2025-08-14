import { useElementBounding, useEventListener, useMagicKeys, useScrollLock, useThrottleFn } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, shallowRef } from 'vue'

export interface UseMarqueeSelectOptions {
  /** 容器元素 */
  container?: HTMLElement | (() => HTMLElement | undefined)
  /** 项目唯一标识 */
  itemKey?: string
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
  checked: boolean
  rect: DOMRect
}

interface Point {
  x: number
  y: number
  top: number
  left: number
}

export function useMarqueeSelect(options: UseMarqueeSelectOptions = {}) {
  const {
    container,
    itemKey = 'data-selection-key',
    disabled = false,
    selectionBoxClass = 'marquee-selection-box',
    minDistance = 10,
  } = options

  const THROTTLE_TIME = 1000 / 120
  const isSelecting = shallowRef(false)
  const pressed = shallowRef(false)
  const startPoint = shallowRef<Point>({ x: 0, y: 0, top: 0, left: 0 })
  const endPoint = shallowRef<Point>({ x: 0, y: 0, top: 0, left: 0 })
  const selectionBox = shallowRef<HTMLElement | null>(null)
  const containerElement = shallowRef<HTMLElement | null>(null)
  const containerRect = useElementBounding(containerElement)
  const originalUserSelect = shallowRef<string>('')
  const items = shallowRef<Item[]>([])

  /** 滚动锁定 */
  const scrollLock = useScrollLock(containerElement)

  /** 快捷键 */
  const { shift, meta } = useMagicKeys()

  /** 计算选择框的位置和大小 */
  const selectionRect = computed(() => {
    const start = startPoint.value
    const end = endPoint.value

    const left = Math.min(start.x - start.left, end.x - end.left)
    const top = Math.min(start.y - start.top, end.y - end.top)

    const width = Math.abs((end.x - end.left) - (start.x - start.left))
    const height = Math.abs((end.y - end.top) - (start.y - start.top))

    return { left, top, width, height }
  })

  /** 获取容器元素 */
  const getContainer = () => {
    if (typeof container === 'function') {
      return container()
    }
    return container || null
  }

  /** 检测元素是否与选择框相交 */
  const isElementIntersecting = (item: Item) => {
    const containerEl = containerElement.value
    if (!containerEl)
      return false

    const elementRect = item.node.getBoundingClientRect()
    const selection = selectionRect.value

    /** 将元素位置转换为相对于容器的坐标 */
    const elementRelative = {
      left: elementRect.left - containerRect.left.value,
      top: elementRect.top - containerRect.top.value,
      right: elementRect.right - containerRect.left.value,
      bottom: elementRect.bottom - containerRect.top.value,
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
    if (item.checkbox && item.checkbox.checked !== checked) {
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

    return nodes.map((node) => {
      const checkbox = node.querySelector<HTMLInputElement>('input[type="checkbox"]')
      const item: Item = {
        node,
        checkbox: checkbox!,
        rect: node.getBoundingClientRect(),
        checked: checkbox?.checked ?? false,
      }
      return item
    })
  }

  /** 更新选中的项目 */
  const updateSelectedItems = () => {
    if (!isSelecting.value)
      return

    const containerEl = containerElement.value
    if (!containerEl)
      return

    items.value.forEach((item) => {
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
      border: 2px solid #007bff;
      background-color: rgba(0, 123, 255, 0.1);
      pointer-events: none;
      z-index: 1;
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
    const containerEl = containerElement.value
    const scrollLeft = containerEl?.scrollLeft ?? 0
    const scrollTop = containerEl?.scrollTop ?? 0
    box.style.left = `${rect.left + scrollLeft}px`
    box.style.top = `${rect.top + scrollTop}px`
    box.style.width = `${rect.width}px`
    box.style.height = `${rect.height}px`
  }

  /** 结束框选 */
  const endSelection = () => {
    if (!isSelecting.value)
      return

    isSelecting.value = false
    scrollLock.value = false

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

  const onMouseDown = (event: MouseEvent) => {
    if (disabled)
      return

    // 只处理左键
    if (event.button !== 0)
      return

    // 阻止默认行为，防止触发浏览器文本选择

    const x = event.clientX
    const y = event.clientY
    const top = containerRect.top.value ?? 0
    const left = containerRect.left.value ?? 0
    pressed.value = true
    startPoint.value = { x, y, top, left }
    endPoint.value = { x, y, top, left }

    // 保存原始用户选择样式
    if (containerElement.value) {
      originalUserSelect.value = containerElement.value.style.userSelect || ''
    }
  }

  const onMouseMove = useThrottleFn((event: MouseEvent) => {
    if (!pressed.value)
      return

    endPoint.value = {
      x: event.clientX,
      y: event.clientY,
      top: containerRect.top.value ?? 0,
      left: containerRect.left.value ?? 0,
    }

    if (
      Math.abs(startPoint.value.x - endPoint.value.x) < minDistance
      && Math.abs(startPoint.value.y - endPoint.value.y) < minDistance
    ) {
      return
    }

    if (!isSelecting.value) {
      isSelecting.value = true
      scrollLock.value = true
      items.value = getSelectableItems()
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

    endPoint.value = {
      x: endPoint.value.x,
      y: endPoint.value.y,
      top: containerRect.top.value ?? 0,
      left: containerRect.left.value ?? 0,
    }

    updateSelection()
  }, THROTTLE_TIME)

  /** 初始化 */
  const initialize = () => {
    const containerEl = getContainer()
    if (!containerEl)
      return

    containerElement.value = containerEl

    // 创建选择框
    selectionBox.value = createSelectionBox()
    containerEl.appendChild(selectionBox.value)
  }

  /** 清理函数 */
  let cleanup: (() => void) | undefined

  onMounted(() => {
    nextTick(() => {
      initialize()
    })
  })

  onUnmounted(() => {
    cleanup?.()
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
  useEventListener(document, 'scroll', onScroll)

  return {
    // 状态
    isSelecting: computed(() => isSelecting.value),
    selectionRect: computed(() => selectionRect.value),
  }
}
