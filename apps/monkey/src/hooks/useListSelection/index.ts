import { useMagicKeys } from '@vueuse/core'
import { ref, watch } from 'vue'
import { useMarqueeSelect } from '@/hooks/useMarqueeSelect'

/** 目标元素是否为可编辑（输入框/文本域/下拉/contentEditable），是则全选快捷键放行给原生行为 */
function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement))
    return false
  if (target.isContentEditable)
    return true
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select'
}

/** 选中状态原语。状态归属调用方 store，本 composable 只通过这组闭包读写。 */
export interface SelectionAdapter<T> {
  has: (item: T) => boolean
  toggle: (item: T, on: boolean) => void
  clear: () => void
  /** 缺省时由 composable 迭代 list() 调 toggle(item, true)；批量 store 可直传优化 */
  selectAll?: () => void
}

export interface UseListSelectionOptions<T> {
  /** 框选容器（须 position 非静态，且包含所有 item DOM） */
  container: () => HTMLElement | undefined
  /** 已过滤的可见列表（Shift 区间与全选都基于它） */
  list: () => readonly T[]
  /** 框选期间锁定的真实滚动容器；与选择框容器不同时显式传入 */
  scrollContainer?: () => HTMLElement | undefined
  /** item 唯一标识，同时落地为 data-selection-key 供框选 DOM 查询 */
  key: (item: T) => string
  selection: SelectionAdapter<T>
  /** 仅禁框选（drive pathSelect）；点击与快捷键不受影响 */
  disabled?: boolean
  /** 默认态（非选择模式）下 plain click 打开该项；缺省则维持 radio 选中（向后兼容） */
  onOpen?: (item: T) => void
  /** 是否处于选择模式：模式内 plain click 切换选中而非打开。getter 形式以读取外部 ref 最新值 */
  selectMode?: () => boolean
  /** ESC 时退出选择模式（清选中 + 复位锚点由调用方决定）；缺省则 ESC 仅 clear */
  onExitSelectMode?: () => void
}

export interface ListSelectionBind<T> {
  /** 行点击：Shift 区间 / Meta·Ctrl 切换 / 否则 radio（clear + 单选） */
  handleClick: (item: T) => void
  /** spread 到行根元素：携带 data-selection-key 与含交互区排除的 onClick */
  itemProps: (item: T) => {
    'data-selection-key': string
    'onClick': (e: MouseEvent) => void
  }
  /** store 外部清空 / 列表替换后调用，避免下次 Shift 拉到旧锚点 */
  resetAnchor: () => void
}

/**
 * 列表多选交互：拖拽框选 + 整行点击 + Shift/Meta·Ctrl 修饰 + ESC/Cmd·Ctrl+A。
 * 与业务无关——item 类型与 selection 持有方由调用方决定。
 */
export function useListSelection<T>(options: UseListSelectionOptions<T>): ListSelectionBind<T> {
  const { container, scrollContainer, list, key, selection, disabled = false, onOpen, selectMode, onExitSelectMode } = options

  useMarqueeSelect({ container, scrollContainer, disabled })

  /** 仅拦截 Cmd/Ctrl+A，避免触发浏览器原生全选；焦点在可编辑元素上时放行原生全选 */
  const keys = useMagicKeys({
    onEventFired: (e) => {
      if (e.key === 'a' && (e.metaKey || e.ctrlKey) && !isEditable(e.target))
        e.preventDefault()
    },
  })

  const lastCheckedIndex = ref(-1)

  function selectAll() {
    if (selection.selectAll)
      selection.selectAll()
    else
      list().forEach(i => selection.toggle(i, true))
  }

  function handleClick(item: T) {
    const items = list()
    const currentIndex = items.findIndex(i => key(i) === key(item))
    if (currentIndex < 0)
      return

    if (keys.Shift.value && lastCheckedIndex.value !== -1) {
      const start = Math.min(lastCheckedIndex.value, currentIndex)
      const end = Math.max(lastCheckedIndex.value, currentIndex)
      for (let i = start; i <= end; i++)
        selection.toggle(items[i], true)
    }
    else if (keys.Meta.value || keys.Control.value) {
      const was = selection.has(item)
      selection.toggle(item, !was)
      if (!was)
        lastCheckedIndex.value = currentIndex
    }
    else if (selectMode?.()) {
      // 选择模式：toggle 该项，不清空其他
      selection.toggle(item, !selection.has(item))
    }
    else if (onOpen) {
      // 默认态：打开该项
      onOpen(item)
    }
    else {
      // 向后兼容：未注入 onOpen 时维持 radio
      selection.clear()
      selection.toggle(item, true)
      lastCheckedIndex.value = currentIndex
    }
  }

  function resetAnchor() {
    lastCheckedIndex.value = -1
  }

  watch(keys.Escape, (v) => {
    if (!v)
      return
    if (onExitSelectMode) {
      onExitSelectMode()
    }
    else {
      selection.clear()
      resetAnchor()
    }
  })
  watch(keys['Meta+A'], (v) => {
    if (v && !isEditable(document.activeElement))
      selectAll()
  })
  watch(keys['Ctrl+A'], (v) => {
    if (v && !isEditable(document.activeElement))
      selectAll()
  })

  function itemProps(item: T) {
    return {
      'data-selection-key': key(item),
      'onClick': (e: MouseEvent) => {
        // 落在交互控件上交由其自身处理（checkbox 走 toggle，按钮走各自回调）
        if ((e.target as HTMLElement).closest('input, button, label'))
          return
        handleClick(item)
      },
    }
  }

  return { handleClick, itemProps, resetAnchor }
}
