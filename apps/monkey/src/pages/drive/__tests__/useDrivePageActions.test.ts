import type { Share } from '@115master/drive115'
import { describe, expect, it, vi } from 'vitest'
import { toValue } from 'vue'
import { useDrivePageActions } from '../useDrivePageActions'

type DriveAction = Parameters<typeof useDrivePageActions>[1]
type DriveStore = Parameters<typeof useDrivePageActions>[0]

function item(values: Partial<Share.Entity.FilesItem> = {}) {
  return {
    fid: '1',
    n: 'file.mp4',
    ...values,
  } as Share.Entity.FilesItem
}

function setup() {
  const selected = [item({ is_top: 1, m: 1 })]
  const afterAction = vi.fn(() => Promise.resolve())
  const store = {
    nav: { cid: '10' },
    path: [{ cid: '10', name: '目录' }],
    prevLevel: { cid: '5' },
    selection: {
      count: 1,
      values: selected,
    },
    afterAction,
  } as unknown as DriveStore
  const mocks = {
    newFolder: vi.fn(() => Promise.resolve(true)),
    topBatch: vi.fn(() => Promise.resolve(true)),
    starBatch: vi.fn(() => Promise.resolve(true)),
    moveBatch: vi.fn(() => Promise.resolve({ success: true, pid: '20' })),
    dragMove: vi.fn((_cid: string, _items: Share.Entity.FilesItem[], onConfirm?: () => void) => {
      onConfirm?.()
      return Promise.resolve(true)
    }),
    improve: vi.fn(() => Promise.resolve(true)),
    deleteBatch: vi.fn(() => Promise.resolve(true)),
    renameItem: vi.fn(() => Promise.resolve('renamed.mp4')),
    cloudDownload: vi.fn(() => Promise.resolve(true)),
    tagBatch: vi.fn(() => Promise.resolve()),
  }
  const actions = useDrivePageActions(store, mocks as unknown as DriveAction)

  function action(name: string) {
    return actions.groups.flat().find(item => item.id === name)!
  }

  return { action, actions, afterAction, mocks, selected, store }
}

describe('useDrivePageActions', () => {
  it('提供 ActionBar 与右键菜单共用的分组和状态', () => {
    const { action, actions } = setup()

    expect(actions.groups.map(group => group.map(item => item.id))).toEqual([
      ['top', 'star', 'tag'],
      ['move', 'improve', 'rename'],
      ['delete'],
    ])
    expect(toValue(action('top').label)).toBe('取消置顶')
    expect(toValue(action('star').label)).toBe('取消星标')
    expect(toValue(action('top').tone)).toBe('primary')
    expect(toValue(action('star').tone)).toBe('primary')
    expect(toValue(action('improve').visible)).toBe(true)
    expect(toValue(action('rename').visible)).toBe(true)
  })

  it('把当前目录和选择态传给页面操作', async () => {
    const { action, actions, mocks, selected, store } = setup()

    await actions.newFolder()
    await actions.cloudDownload('magnet:?xt=test')
    await action('move').onSelect()
    await action('improve').onSelect()
    await action('rename').onSelect()

    expect(mocks.newFolder).toHaveBeenCalledWith('10')
    expect(mocks.cloudDownload).toHaveBeenCalledWith('10', store.path, 'magnet:?xt=test')
    expect(mocks.moveBatch).toHaveBeenCalledWith('10', selected)
    expect(mocks.improve).toHaveBeenCalledWith(selected, '5')
    expect(mocks.renameItem).toHaveBeenCalledWith(selected[0])
  })

  it('仅在操作成功时刷新，标签操作沿用自身刷新事务', async () => {
    const { action, afterAction, mocks } = setup()

    await action('top').onSelect()
    expect(afterAction).toHaveBeenCalledTimes(1)

    afterAction.mockClear()
    mocks.topBatch.mockResolvedValue(false)
    await action('top').onSelect()
    expect(afterAction).not.toHaveBeenCalled()

    await action('tag').onSelect()
    expect(mocks.tagBatch).toHaveBeenCalledTimes(1)
    expect(afterAction).not.toHaveBeenCalled()
  })

  it('拖拽移动成功后刷新并透传结果', async () => {
    const { actions, afterAction, mocks, selected } = setup()
    const onConfirm = vi.fn()

    await expect(actions.dragMove('20', selected, onConfirm)).resolves.toBe(true)
    expect(mocks.dragMove).toHaveBeenCalledWith('20', selected, onConfirm)
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(afterAction).toHaveBeenCalledTimes(1)

    afterAction.mockClear()
    mocks.dragMove.mockResolvedValue(false)
    await expect(actions.dragMove('30', selected)).resolves.toBe(false)
    expect(afterAction).not.toHaveBeenCalled()
  })
})
