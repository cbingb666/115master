import type { Ref } from 'vue'
import type { SelectionAdapter } from '@/hooks/useListSelection'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

/** mock 工厂（hoisted）懒执行：useListSelection import 时才赋值，此时 let 已声明，无 TDZ */
let keys: Record<string, Ref<boolean>>

vi.mock('@/hooks/useMarqueeSelect', () => ({ useMarqueeSelect: () => ({}) }))
vi.mock('@vueuse/core', async () => {
  const { ref } = await import('vue')
  keys = {
    'Shift': ref(false),
    'Meta': ref(false),
    'Control': ref(false),
    'Escape': ref(false),
    'Meta+A': ref(false),
    'Ctrl+A': ref(false),
  }
  return { useMagicKeys: () => keys }
})

const { useListSelection } = await import('@/hooks/useListSelection')

interface Item {
  id: string
}

function setup(
  selection: SelectionAdapter<Item>,
  list: Item[],
  opts: { onOpen?: (i: Item) => void, selectMode?: () => boolean } = {},
) {
  const scope = effectScope()
  const bind = scope.run(() => useListSelection({
    container: () => undefined,
    list: () => list,
    key: i => i.id,
    selection,
    onOpen: opts.onOpen,
    selectMode: opts.selectMode,
  }))!
  return { scope, bind }
}

describe('useListSelection', () => {
  beforeEach(() => {
    keys.Shift.value = false
    keys.Meta.value = false
    keys.Control.value = false
    keys.Escape.value = false
    keys['Meta+A'].value = false
    keys['Ctrl+A'].value = false
  })

  it('plain click → radio（先 clear 再单选该项）', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope, bind } = setup({ has: () => false, toggle, clear }, list)

    bind.handleClick({ id: 'a' })

    expect(clear).toHaveBeenCalledOnce()
    expect(toggle).toHaveBeenCalledWith({ id: 'a' }, true)
    scope.stop()
  })

  it('默认态 plain click + onOpen → 调 onOpen，不改变选中', () => {
    const onOpen = vi.fn()
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope, bind } = setup({ has: () => false, toggle, clear }, list, { onOpen })

    bind.handleClick({ id: 'a' })

    expect(onOpen).toHaveBeenCalledWith({ id: 'a' })
    expect(toggle).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
    scope.stop()
  })

  it('选择模式 plain click → toggle 该项不清空其他', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope, bind } = setup(
      { has: i => i.id === 'a', toggle, clear },
      list,
      { selectMode: () => true },
    )

    bind.handleClick({ id: 'a' }) // 已选中 → 取消
    bind.handleClick({ id: 'b' }) // 未选中 → 选中

    expect(clear).not.toHaveBeenCalled()
    expect(toggle).toHaveBeenNthCalledWith(1, { id: 'a' }, false)
    expect(toggle).toHaveBeenNthCalledWith(2, { id: 'b' }, true)
    scope.stop()
  })

  it('选择模式优先于 onOpen（选择模式中单击不打开）', () => {
    const onOpen = vi.fn()
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }]
    const { scope, bind } = setup(
      { has: () => false, toggle, clear },
      list,
      { onOpen, selectMode: () => true },
    )

    bind.handleClick({ id: 'a' })

    expect(onOpen).not.toHaveBeenCalled()
    expect(toggle).toHaveBeenCalledWith({ id: 'a' }, true)
    scope.stop()
  })

  it('按住 Meta 键 → 切换该项，不清空其他', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope, bind } = setup({ has: i => i.id === 'a', toggle, clear }, list)

    keys.Meta.value = true
    bind.handleClick({ id: 'a' }) // 已选中 → 取消
    bind.handleClick({ id: 'b' }) // 未选中 → 选中

    expect(clear).not.toHaveBeenCalled()
    expect(toggle).toHaveBeenNthCalledWith(1, { id: 'a' }, false)
    expect(toggle).toHaveBeenNthCalledWith(2, { id: 'b' }, true)
    scope.stop()
  })

  it('已有锚点时 Shift 点击 → 区间全部 toggle(true)', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    const { scope, bind } = setup({ has: () => false, toggle, clear }, list)

    bind.handleClick({ id: 'a' }) // 锚点 = 0
    toggle.mockClear()
    clear.mockClear()

    keys.Shift.value = true
    bind.handleClick({ id: 'c' }) // 区间 [0,2]

    expect(clear).not.toHaveBeenCalled()
    expect(toggle).toHaveBeenCalledTimes(3)
    expect(toggle).toHaveBeenCalledWith({ id: 'a' }, true)
    expect(toggle).toHaveBeenCalledWith({ id: 'b' }, true)
    expect(toggle).toHaveBeenCalledWith({ id: 'c' }, true)
    scope.stop()
  })

  it('resetAnchor 后 Shift → 无锚点，降级为 radio', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    const { scope, bind } = setup({ has: () => false, toggle, clear }, list)

    bind.handleClick({ id: 'a' }) // 锚点 = 0
    bind.resetAnchor()
    toggle.mockClear()
    clear.mockClear()

    keys.Shift.value = true
    bind.handleClick({ id: 'c' })

    expect(clear).toHaveBeenCalledOnce()
    expect(toggle).toHaveBeenCalledWith({ id: 'c' }, true)
    expect(toggle).toHaveBeenCalledTimes(1)
    scope.stop()
  })

  it('selectAll 缺省 → 迭代 list 调 toggle(item, true)', async () => {
    const toggle = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope } = setup({ has: () => false, toggle, clear: vi.fn() }, list)

    keys['Meta+A'].value = true
    await nextTick()

    expect(toggle).toHaveBeenCalledTimes(2)
    expect(toggle).toHaveBeenCalledWith({ id: 'a' }, true)
    expect(toggle).toHaveBeenCalledWith({ id: 'b' }, true)
    scope.stop()
  })

  it('selectAll 直传 → 调用适配器方法，不走 fallback', async () => {
    const selectAll = vi.fn()
    const toggle = vi.fn()
    const list = [{ id: 'a' }, { id: 'b' }]
    const { scope } = setup({ has: () => false, toggle, clear: vi.fn(), selectAll }, list)

    keys['Ctrl+A'].value = true
    await nextTick()

    expect(selectAll).toHaveBeenCalledOnce()
    expect(toggle).not.toHaveBeenCalled()
    scope.stop()
  })

  it('itemProps 落地 data-selection-key，且点击非交互区触发 handleClick', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const list = [{ id: 'a' }]
    const { scope, bind } = setup({ has: () => false, toggle, clear }, list)

    const props = bind.itemProps({ id: 'a' })
    expect(props['data-selection-key']).toBe('a')

    /** 非交互区（target.closest 返回 null）→ 触发 handleClick */
    const safeTarget = { closest: () => null } as unknown as HTMLElement
    props.onClick({ target: safeTarget } as unknown as MouseEvent)
    expect(clear).toHaveBeenCalledOnce()

    // 落在 input 上 → 不触发
    clear.mockClear()
    const inputTarget = { closest: (s: string) => (s.includes('input') ? inputTarget : null) } as unknown as HTMLElement
    props.onClick({ target: inputTarget } as unknown as MouseEvent)
    expect(clear).not.toHaveBeenCalled()
    scope.stop()
  })

  it('handleClick 对不在 list 的项 → no-op', () => {
    const toggle = vi.fn()
    const clear = vi.fn()
    const { scope, bind } = setup({ has: () => false, toggle, clear }, [{ id: 'a' }])

    bind.handleClick({ id: 'zzz' })

    expect(toggle).not.toHaveBeenCalled()
    expect(clear).not.toHaveBeenCalled()
    scope.stop()
  })
})
