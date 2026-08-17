import type { Share } from '@115master/drive115'
import type { InfiniteData } from '@tanstack/vue-query'
import type { DriveListPage, DriveListRequest } from '../query'
import { QueryClient } from '@tanstack/vue-query'
import { describe, expect, it, vi } from 'vitest'
import {
  applyDriveListMutation,
  invalidateDriveListScope,
  reorder,
} from '../cache'
import { driveListKeys } from '../query'

vi.mock('@/utils/drive115Instance', () => ({ drive115: { file: {} } }))

function item(fid: string, extra: Partial<Share.Entity.FilesItem> = {}): Share.Entity.FilesItem {
  return { fid, cid: '', n: `file-${fid}`, fc: 1, pc: fid, ...extra } as Share.Entity.FilesItem
}

function page(pageNumber: number, items: Share.Entity.FilesItem[], total = items.length, size = 2): DriveListPage {
  return {
    items,
    total,
    fileCount: items.length,
    folderCount: 0,
    path: [],
    page: pageNumber,
    size,
    order: 'user_ptime',
    asc: 0,
    fcMix: 0,
  }
}

function request(extra: Partial<DriveListRequest> = {}): DriveListRequest {
  return {
    area: 'all',
    cid: '100',
    page: 1,
    size: 2,
    order: '',
    asc: 0,
    fcMix: 0,
    suffix: '',
    type: '',
    fc: '',
    nf: '',
    keyword: '',
    search: false,
    ...extra,
  }
}

describe('driveListKeys', () => {
  it('隔离分页、无限、搜索与不同筛选组合', () => {
    const base = driveListKeys.page(request())
    expect(driveListKeys.page(request())).toEqual(base)
    expect(driveListKeys.page(request({ page: 2 }))).not.toEqual(base)
    expect(driveListKeys.page(request({ size: 20, fc: '1', nf: '1' }))).not.toEqual(base)
    expect(driveListKeys.infinite(request())).not.toEqual(base)
    expect(driveListKeys.page(request({ search: true, keyword: '电影' }))).not.toEqual(base)
  })
})

describe('reorder', () => {
  it('remove 跨缓存页补位并同步 total', () => {
    const pages = new Map([
      [1, page(1, [item('a'), item('b')], 4)],
      [2, page(2, [item('c'), item('d')], 4)],
    ])

    const result = reorder(pages, 2, { kind: 'remove', ids: ['a'] })

    expect(result.get(1)?.items.map(value => value.n)).toEqual(['file-b', 'file-c'])
    expect(result.get(2)?.items.map(value => value.n)).toEqual(['file-d'])
    expect(result.get(1)?.total).toBe(3)
    expect(result.get(2)?.total).toBe(3)
  })

  it('update 替换命中实体但不改变位置', () => {
    const pages = new Map([[1, page(1, [item('a'), item('b')])]])

    const result = reorder(pages, 2, {
      kind: 'update',
      item: item('a', { n: 'renamed' }),
    })

    expect(result.get(1)?.items.map(value => value.n)).toEqual(['renamed', 'file-b'])
  })

  it('缓存页不连续时不跨越缺口补位', () => {
    const pages = new Map([
      [1, page(1, [item('a'), item('b')], 6)],
      [3, page(3, [item('e'), item('f')], 6)],
    ])

    const result = reorder(pages, 2, { kind: 'remove', ids: ['a'] })

    expect(result.get(1)?.items.map(value => value.n)).toEqual(['file-b'])
    expect(result.get(3)?.items.map(value => value.n)).toEqual(['file-e', 'file-f'])
  })
})

describe('tanStack cache projection', () => {
  it('一次 remove 同步更新同目录的分页变体并跨页补位', () => {
    const client = new QueryClient()
    const firstKey = driveListKeys.page(request({ page: 1 }))
    const secondKey = driveListKeys.page(request({ page: 2 }))
    const browserKey = driveListKeys.page(request({ size: 20, fc: '1', nf: '1' }))
    client.setQueryData(firstKey, page(1, [item('a'), item('b')], 4))
    client.setQueryData(secondKey, page(2, [item('c'), item('d')], 4))
    client.setQueryData(browserKey, page(1, [item('a'), item('x')], 2, 20))

    const touched = applyDriveListMutation(client, 'all', '100', {
      kind: 'remove',
      ids: ['a'],
    })

    expect(touched).toBe(true)
    expect(client.getQueryData<DriveListPage>(firstKey)?.items.map(value => value.n)).toEqual(['file-b', 'file-c'])
    expect(client.getQueryData<DriveListPage>(secondKey)?.items.map(value => value.n)).toEqual(['file-d'])
    expect(client.getQueryData<DriveListPage>(browserKey)?.items.map(value => value.n)).toEqual(['file-x'])
    expect(client.getQueryData<DriveListPage>(browserKey)?.total).toBe(1)
  })

  it('同步更新无限列表缓存', () => {
    const client = new QueryClient()
    const key = driveListKeys.infinite(request())
    client.setQueryData<InfiniteData<DriveListPage, number>>(key, {
      pages: [
        page(1, [item('a'), item('b')], 4),
        page(2, [item('c'), item('d')], 4),
      ],
      pageParams: [1, 2],
    })

    applyDriveListMutation(client, 'all', '100', { kind: 'remove', ids: ['a'] })

    const result = client.getQueryData<InfiniteData<DriveListPage, number>>(key)
    expect(result?.pages.flatMap(value => value.items).map(value => value.n)).toEqual([
      'file-b',
      'file-c',
      'file-d',
    ])
    expect(result?.pages.every(value => value.total === 3)).toBe(true)
  })

  it('按 area + cid 精确失效，保留其他目录', async () => {
    const client = new QueryClient()
    const target = driveListKeys.page(request())
    const sibling = driveListKeys.page(request({ cid: '200' }))
    client.setQueryData(target, page(1, [item('a')]))
    client.setQueryData(sibling, page(1, [item('b')]))

    await invalidateDriveListScope(client, 'all', '100')

    expect(client.getQueryState(target)?.isInvalidated).toBe(true)
    expect(client.getQueryState(sibling)?.isInvalidated).toBe(false)
  })
})
