import type { Share } from '@115master/drive115'
import { describe, expect, it, vi } from 'vitest'
import { cacheKey, cidPrefix, PageCache, reorder } from '../cache'

function item(fid: string, extra: Partial<Share.Entity.FilesItem> = {}): Share.Entity.FilesItem {
  return { fid, cid: '', n: `file-${fid}`, fc: 1, ...extra } as Share.Entity.FilesItem
}

function folder(cid: string, extra: Partial<Share.Entity.FilesItem> = {}): Share.Entity.FilesItem {
  return { fid: '', cid, n: `folder-${cid}`, fc: 0, ...extra } as Share.Entity.FilesItem
}

function page(items: Share.Entity.FilesItem[], total: number) {
  return { items, total, order: 'user_ptime', asc: 0, fc_mix: 0 }
}

function query(extra: Partial<Parameters<typeof cacheKey>[0]> = {}) {
  return {
    area: 'all',
    cid: '100',
    page: 1,
    size: 20,
    order: 'user_ptime',
    asc: 0,
    fc_mix: 0,
    suffix: '',
    type: '',
    fc: '',
    nf: '',
    ...extra,
  }
}

describe('cacheKey', () => {
  it('全字段参与 key，任一字段不同 → key 不同', () => {
    const base = cacheKey(query())
    expect(cacheKey(query())).toBe(base)
    expect(cacheKey(query({ area: 'star' }))).not.toBe(base)
    expect(cacheKey(query({ cid: '200' }))).not.toBe(base)
    expect(cacheKey(query({ page: 2 }))).not.toBe(base)
    expect(cacheKey(query({ size: 50 }))).not.toBe(base)
    expect(cacheKey(query({ order: 'file_name' }))).not.toBe(base)
    expect(cacheKey(query({ asc: 1 }))).not.toBe(base)
    expect(cacheKey(query({ fc_mix: 1 }))).not.toBe(base)
    expect(cacheKey(query({ suffix: 'mp4' }))).not.toBe(base)
    expect(cacheKey(query({ type: '4' }))).not.toBe(base)
    expect(cacheKey(query({ fc: '1' }))).not.toBe(base)
    expect(cacheKey(query({ nf: '1' }))).not.toBe(base)
  })

  it('drive 页与 FileBroswer 的同 cid 查询生成不同 key（size/fc/nf 隔离）', () => {
    const driveKey = cacheKey(query({ size: 100 }))
    const browserKey = cacheKey(query({ size: 20, fc: '1', nf: '1' }))
    expect(driveKey).not.toBe(browserKey)
  })

  it('cidPrefix 匹配同目录所有 key（含不同排序/size）', () => {
    const prefix = cidPrefix('all', '100')
    expect(cacheKey(query()).startsWith(prefix)).toBe(true)
    expect(cacheKey(query({ page: 5, size: 50, order: 'file_name', asc: 1 })).startsWith(prefix)).toBe(true)
    expect(cacheKey(query({ cid: '1000' })).startsWith(prefix)).toBe(false)
    expect(cacheKey(query({ area: 'star' })).startsWith(prefix)).toBe(false)
  })
})

describe('pageCache', () => {
  it('超容量淘汰最久未使用', () => {
    const cache = new PageCache(3)
    cache.set('a', page([item('1')], 1))
    cache.set('b', page([item('2')], 1))
    cache.set('c', page([item('3')], 1))
    cache.set('d', page([item('4')], 1))
    expect(cache.get('a')).toBeUndefined()
    expect(cache.get('b')).toBeDefined()
  })

  it('get 后更新 LRU 顺序', () => {
    const cache = new PageCache(2)
    cache.set('a', page([item('1')], 1))
    cache.set('b', page([item('2')], 1))
    cache.get('a')
    cache.set('c', page([item('3')], 1))
    expect(cache.get('a')).toBeDefined()
    expect(cache.get('b')).toBeUndefined()
  })

  it('invalidateCid 前缀删除该目录全部页（含不同排序/size）', () => {
    const cache = new PageCache()
    cache.set(cacheKey(query({ page: 1 })), page([item('1')], 40))
    cache.set(cacheKey(query({ page: 2 })), page([item('2')], 40))
    cache.set(cacheKey(query({ order: 'file_name', asc: 1 })), page([item('3')], 40))
    cache.set(cacheKey(query({ size: 50 })), page([item('4')], 40))
    cache.set(cacheKey(query({ cid: '999' })), page([item('5')], 40))
    cache.set(cacheKey(query({ area: 'star' })), page([item('6')], 40))

    cache.invalidateCid('all', '100')

    expect(cache.get(cacheKey(query({ page: 1 })))).toBeUndefined()
    expect(cache.get(cacheKey(query({ page: 2 })))).toBeUndefined()
    expect(cache.get(cacheKey(query({ order: 'file_name', asc: 1 })))).toBeUndefined()
    expect(cache.get(cacheKey(query({ size: 50 })))).toBeUndefined()
    expect(cache.get(cacheKey(query({ cid: '999' })))).toBeDefined()
    expect(cache.get(cacheKey(query({ area: 'star' })))).toBeDefined()
  })

  it('fetch 同 key 并发只调一次 loader', async () => {
    const cache = new PageCache()
    const loader = vi.fn().mockResolvedValue('data')
    const [a, b] = await Promise.all([
      cache.fetch('k', loader),
      cache.fetch('k', loader),
    ])
    expect(a).toBe('data')
    expect(b).toBe('data')
    expect(loader).toHaveBeenCalledTimes(1)
  })

  it('fetch 失败后清理 in-flight，可重试', async () => {
    const cache = new PageCache()
    const loader = vi.fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('ok')
    await expect(cache.fetch('k', loader)).rejects.toThrow('boom')
    await expect(cache.fetch('k', loader)).resolves.toBe('ok')
    expect(loader).toHaveBeenCalledTimes(2)
  })
})

describe('reorder', () => {
  it('remove 单页内移除 → 后续 item 前移、total-1', () => {
    const pages = new Map([[1, page([item('a'), item('b'), item('c')], 3)]])
    const result = reorder(pages, 20, { kind: 'remove', ids: ['a'] })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-b', 'file-c'])
    expect(result.get(1)?.total).toBe(2)
  })

  it('remove 跨页顺延 → 第 1 页移除后从已缓存第 2 页补满', () => {
    const pages = new Map([
      [1, page([item('a'), item('b')], 4)],
      [2, page([item('c'), item('d')], 4)],
    ])
    const result = reorder(pages, 2, { kind: 'remove', ids: ['a'] })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-b', 'file-c'])
    expect(result.get(2)?.items.map(i => i.n)).toEqual(['file-d'])
    expect(result.get(1)?.total).toBe(3)
  })

  it('remove 存在未缓存后续页 → 最后一页允许不满，不凭空造数据', () => {
    const pages = new Map([
      [1, page([item('a'), item('b')], 10)],
      [2, page([item('c'), item('d')], 10)],
    ])
    const result = reorder(pages, 2, { kind: 'remove', ids: ['a', 'c'] })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-b', 'file-d'])
    expect(result.get(2)).toBeUndefined()
    expect(result.get(1)?.total).toBe(8)
  })

  it('remove 多个 id、id 不存在时幂等不报错', () => {
    const pages = new Map([[1, page([item('a'), item('b')], 2)]])
    const result = reorder(pages, 20, { kind: 'remove', ids: ['a', 'ghost'] })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-b'])
    expect(result.get(1)?.total).toBe(1)
  })

  it('remove 按 getFilesItemId 匹配（文件夹 cid、文件 fid）', () => {
    const pages = new Map([[1, page([item('f1'), folder('c1')], 2)]])
    const result = reorder(pages, 20, { kind: 'remove', ids: ['c1'] })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-f1'])
  })

  it('update 就地替换、不影响顺序与 total', () => {
    const pages = new Map([
      [1, page([item('a'), item('b')], 4)],
      [2, page([item('c'), item('d')], 4)],
    ])
    const renamed = item('b', { n: 'renamed' })
    const result = reorder(pages, 2, { kind: 'update', item: renamed })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-a', 'renamed'])
    expect(result.get(1)?.total).toBe(4)
    expect(result.get(2)?.items.map(i => i.n)).toEqual(['file-c', 'file-d'])
  })

  it('update 未命中任何 item → 原样返回', () => {
    const pages = new Map([[1, page([item('a')], 1)]])
    const result = reorder(pages, 20, { kind: 'update', item: item('ghost') })
    expect(result.get(1)?.items.map(i => i.n)).toEqual(['file-a'])
  })

  it('全部移除 → 空页被清理，total=0', () => {
    const pages = new Map([
      [1, page([item('a'), item('b')], 2)],
      [2, page([item('c')], 2)],
    ])
    const result = reorder(pages, 2, { kind: 'remove', ids: ['a', 'b', 'c'] })
    expect(result.size).toBe(0)
  })
})
