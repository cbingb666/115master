import type { ShallowRef } from 'vue'
import type { SelectionAdapter } from '@/hooks/useListSelection'
import { useEventListener } from '@vueuse/core'
import { shallowRef, watch } from 'vue'
import { useListSelection } from '@/hooks/useListSelection'

export interface UseMultiSelectOptions<T> {
  /** 框选容器（须 position 非静态，且包含所有 item DOM） */
  container: () => HTMLElement | undefined
  /** 已过滤的可见列表（Shift 区间 / 全选 / 反选都基于它） */
  list: () => readonly T[]
  /** item 唯一标识，落地为 data-selection-key 供框选 / 点空白判定 */
  key: (item: T) => string
  /** 选中状态原语；状态归属调用方（store），本 composable 只经此读写 */
  selection: SelectionAdapter<T>
  /** 已选数量（驱动选择模式进出）：0→N 进入；N→0 退出 */
  count: () => number
  /** 仅禁框选（点击与快捷键不受影响） */
  disabled?: boolean
  /** 默认态（非选择模式）plain click 打开该项；缺省维持 radio 选中 */
  onOpen?: (item: T) => void
  /** 启用右键选中 + 菜单定位；缺省 true */
  contextmenu?: boolean
}

export interface MultiSelectBind<T> {
  /** 选择模式：选中数 > 0 时为 true */
  selectMode: ShallowRef<boolean>
  /** 退出选择模式：selectMode=false + clear + 复位 Shift 锚点 */
  exit: () => void
  /** 反选可见列表 */
  invert: () => void
  /** spread 到行根元素：data-selection-key + onClick + onContextmenu */
  itemProps: (item: T) => {
    'data-selection-key': string
    'onClick': (e: MouseEvent) => void
    'onContextmenu': (e: MouseEvent) => void
  }
  /** 复位 Shift 锚点（列表替换 / 外部清空后调用） */
  resetAnchor: () => void
  /** 右键菜单元数据：调用方据此渲染 ContextMenu */
  contextmenuShow: ShallowRef<boolean>
  contextmenuPosition: ShallowRef<{ x: number, y: number }>
  /** 关闭右键菜单 */
  closeContextmenu: () => void
}

/**
 * 列表多选编排：在 {@link useListSelection}（框选 + 点击修饰 + ESC/Cmd·Ctrl+A）之上，
 * 补齐「选择模式进出 / 退出 / 反选 / 右键选中 / 点空白退出」。
 *
 * 与业务无关——item 类型与 selection 持有方由调用方决定。
 */
export function useMultiSelect<T>(options: UseMultiSelectOptions<T>): MultiSelectBind<T> {
  const {
    container,
    list,
    key,
    selection,
    count,
    disabled = false,
    onOpen,
    contextmenu = true,
  } = options

  const selectMode = shallowRef(false)
  const contextmenuShow = shallowRef(false)
  const contextmenuPosition = shallowRef({ x: 0, y: 0 })

  const { itemProps: listItemProps, resetAnchor } = useListSelection<T>({
    container,
    list,
    key,
    selection,
    disabled,
    onOpen,
    selectMode: () => selectMode.value,
    onExitSelectMode: exit,
  })

  function exit() {
    selectMode.value = false
    selection.clear()
    resetAnchor()
  }

  function invert() {
    list().forEach(item => selection.toggle(item, !selection.has(item)))
  }

  /** 选中数驱动选择模式进出：0→N 进入；N→0 自动退出（取消最后一项等） */
  watch(() => count(), (size, prev) => {
    if (prev === 0 && size > 0)
      selectMode.value = true
    if (prev > 0 && size === 0)
      exit()
  })

  /** 右键：已多选则确保右键项被选中（不清空）；否则 radio 单选该项 */
  function handleContextmenu(item: T, e: MouseEvent) {
    if (!contextmenu)
      return
    e.preventDefault()
    contextmenuShow.value = true
    contextmenuPosition.value = { x: e.clientX, y: e.clientY }
    if (count() <= 1)
      selection.clear()
    selection.toggle(item, true)
  }

  function closeContextmenu() {
    contextmenuShow.value = false
  }

  /** 点空白退出：位移 < 5px 且未命中 [data-selection-key] */
  let downX = 0
  let downY = 0
  useEventListener(container, 'pointerdown', (e: PointerEvent) => {
    downX = e.clientX
    downY = e.clientY
  })
  useEventListener(container, 'pointerup', (e: PointerEvent) => {
    if (!selectMode.value)
      return
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5)
      return
    if ((e.target as HTMLElement).closest('[data-selection-key]'))
      return
    exit()
  })

  function itemProps(item: T) {
    const base = listItemProps(item)
    return {
      'data-selection-key': base['data-selection-key'],
      'onClick': base.onClick,
      'onContextmenu': (e: MouseEvent) => handleContextmenu(item, e),
    }
  }

  return {
    selectMode,
    exit,
    invert,
    itemProps,
    resetAnchor,
    contextmenuShow,
    contextmenuPosition,
    closeContextmenu,
  }
}
