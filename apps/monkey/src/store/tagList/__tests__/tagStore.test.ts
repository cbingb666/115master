import { Core } from '@115master/drive115'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { drive115 } from '@/utils/drive115Instance'
import { normalizeTags, useTagStore } from '../index'

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    tag: {
      getLabels: vi.fn(),
      addLabels: vi.fn(),
      editLabel: vi.fn(),
      deleteLabel: vi.fn(),
    },
  },
}))

const tag = drive115.tag

function listResponse(list: unknown[]) {
  return { state: true, code: 0, message: '', data: { total: list.length, list } }
}

function ok(data?: unknown) {
  return { state: true, code: 0, message: '', ...(data !== undefined && { data }) }
}

function fail(message = '失败') {
  return { state: false, code: 1, message, error: message }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('normalizeTags', () => {
  it('returns empty for non-array input', () => {
    expect(normalizeTags(undefined)).toEqual([])
    expect(normalizeTags(null)).toEqual([])
    expect(normalizeTags({})).toEqual([])
  })

  it('drops entries missing required id/name and keeps valid ones (count + fields)', () => {
    const raw = [
      { id: '1', name: '电影', color: '#FF4B30', sort: '2', create_time: 1690000000, update_time: 1700000000 },
      { id: '2' }, // 缺 name
      { name: '无id' }, // 缺 id
      { id: '', name: '空id' }, // 空 id
      { id: '3', name: '音乐', color: '', sort: 1 }, // 无色
      'not-an-object',
      null,
    ]
    const tags = normalizeTags(raw)

    expect(tags).toHaveLength(2)
    expect(tags[0]).toMatchObject({ id: '1', name: '电影', color: '#FF4B30', sort: 2, createTime: 1690000000, updateTime: 1700000000 })
    expect(tags[1].id).toBe('3')
  })

  it('normalizes missing color to LabelColor.Blank and sort to a number', () => {
    const [tag] = normalizeTags([{ id: '1', name: 'A' }])
    expect(tag.color).toBe('#000000')
    expect(tag.sort).toBe(0)
    expect(tag.createTime).toBeUndefined()
  })
})

describe('useTagStore.load', () => {
  it('fills tags from getLabels response', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: '电影', color: '#FF4B30' },
      { id: '2', name: '音乐', color: '#2670FC' },
    ]) as never)

    const store = useTagStore()
    await store.load()

    expect(store.tags).toHaveLength(2)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
    expect(tag.getLabels).toHaveBeenCalledWith({ offset: 0, limit: 200 })
  })

  it('sets error (Drive115Error) when state is false', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(fail('出错了') as never)

    const store = useTagStore()
    await store.load()

    expect(store.tags).toEqual([])
    expect(store.error).toBeInstanceOf(Core.Drive115Error)
    expect(store.error?.message).toBe('出错了')
  })

  it('sets error when the request rejects (network)', async () => {
    vi.mocked(tag.getLabels).mockRejectedValue(new Core.Drive115Error('network', Core.Drive115ErrorCode.NetworkError) as never)

    const store = useTagStore()
    await store.load()

    expect(store.error).toBeInstanceOf(Core.Drive115Error)
    expect(store.error?.code).toBe(Core.Drive115ErrorCode.NetworkError)
  })
})

describe('useTagStore search', () => {
  async function storeWith(...list: Array<{ id: string, name: string, color?: string }>) {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse(list) as never)
    const s = useTagStore()
    await s.load()
    return s
  }

  it('filters by substring (case-insensitive) and trims keyword', async () => {
    const s = await storeWith(
      { id: '1', name: '电影' },
      { id: '2', name: '电音' },
      { id: '3', name: 'Music' },
    )

    s.setKeyword(' 电 ')
    expect(s.filtered.map(t => t.id)).toEqual(['1', '2'])

    s.setKeyword('music')
    expect(s.filtered.map(t => t.id)).toEqual(['3'])
  })

  it('returns empty list (no match) without touching source', async () => {
    const s = await storeWith({ id: '1', name: '电影' })

    s.setKeyword('xyz')
    expect(s.filtered).toEqual([])
    expect(s.tags).toHaveLength(1)
  })

  it('returns all when keyword is empty', async () => {
    const s = await storeWith({ id: '1', name: '电影' })

    s.setKeyword('')
    expect(s.filtered).toHaveLength(1)
  })
})

describe('useTagStore CRUD', () => {
  it('create appends the returned tag', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([{ id: '1', name: '电影', color: '#FF4B30' }]) as never)
    vi.mocked(tag.addLabels).mockResolvedValue(ok([{ id: '2', name: '音乐', color: '#2670FC' }]) as never)

    const store = useTagStore()
    await store.load()
    await store.create('音乐', '#2670FC')

    expect(store.tags.map(t => t.id)).toEqual(['1', '2'])
    expect(tag.addLabels).toHaveBeenCalledWith([{ name: '音乐', color: '#2670FC' }])
  })

  it('create reloads when response carries no data', async () => {
    vi.mocked(tag.getLabels).mockResolvedValueOnce(listResponse([]) as never).mockResolvedValueOnce(listResponse([{ id: '7', name: '新', color: '#43BA80' }]) as never)
    vi.mocked(tag.addLabels).mockResolvedValue(ok([]) as never)

    const store = useTagStore()
    await store.load()
    await store.create('新', '#43BA80')

    expect(store.tags.map(t => t.id)).toEqual(['7'])
  })

  it('create throws Drive115Error on state=false', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([]) as never)
    vi.mocked(tag.addLabels).mockResolvedValue(fail('重名') as never)

    const store = useTagStore()
    await store.load()

    await expect(store.create('A', '#FF4B30')).rejects.toBeInstanceOf(Core.Drive115Error)
    expect(store.tags).toEqual([])
  })

  it('update mutates the matched tag fields', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([{ id: '1', name: '电影', color: '#FF4B30' }]) as never)
    vi.mocked(tag.editLabel).mockResolvedValue(ok() as never)

    const store = useTagStore()
    await store.load()
    await store.update('1', '影视', '#2670FC')

    expect(store.tags[0]).toMatchObject({ id: '1', name: '影视', color: '#2670FC' })
    expect(tag.editLabel).toHaveBeenCalledWith({ id: '1', name: '影视', color: '#2670FC' })
  })

  it('remove drops the tag from the list', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: '电影', color: '#FF4B30' },
      { id: '2', name: '音乐', color: '#2670FC' },
    ]) as never)
    vi.mocked(tag.deleteLabel).mockResolvedValue(ok() as never)

    const store = useTagStore()
    await store.load()
    await store.remove('1')

    expect(store.tags.map(t => t.id)).toEqual(['2'])
    expect(tag.deleteLabel).toHaveBeenCalledWith({ id: '1' })
  })
})

describe('useTagStore.removeBatch (allSettled 容错)', () => {
  it('removes successes, keeps failures, reports failed ids with Drive115Error', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
      { id: '3', name: 'c' },
    ]) as never)
    vi.mocked(tag.deleteLabel).mockImplementation(({ id }) => {
      if (id === '2')
        return Promise.resolve(fail('被引用') as never)
      return Promise.resolve(ok() as never)
    })

    const store = useTagStore()
    await store.load()
    const failed = await store.removeBatch(['1', '2', '3'])

    // 成功项移除、失败项保留
    expect(store.tags.map(t => t.id)).toEqual(['2'])
    // 失败上报：单个 deleteLabel 仍以 Drive115Error 形态抛出（ADR-0001 兼容）
    expect(failed).toHaveLength(1)
    expect(failed[0].id).toBe('2')
    expect(failed[0].error).toBeInstanceOf(Core.Drive115Error)
    expect(failed[0].error.message).toBe('被引用')
  })

  it('deselects successful deletes but keeps failed ones selected', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ]) as never)
    vi.mocked(tag.deleteLabel).mockImplementation(({ id }) => {
      if (id === '2')
        return Promise.resolve(fail() as never)
      return Promise.resolve(ok() as never)
    })

    const store = useTagStore()
    await store.load()
    store.selectAll()
    await store.removeBatch(['1', '2'])

    // 成功删除的 1 取消选中；失败的 2 仍选中（便于重试）
    expect(store.selectedIds).toEqual(['2'])
  })

  it('propagates rejected deleteLabel as Drive115Error in failures', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([{ id: '1', name: 'a' }]) as never)
    vi.mocked(tag.deleteLabel).mockRejectedValue(new Error('boom') as never)

    const store = useTagStore()
    await store.load()
    const failed = await store.removeBatch(['1'])

    expect(store.tags.map(t => t.id)).toEqual(['1']) // 失败项保留
    expect(failed[0].error).toBeInstanceOf(Core.Drive115Error)
    expect(failed[0].error.message).toBe('boom')
  })
})

describe('useTagStore selection', () => {
  it('selectAll selects all filtered ids', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: 'a' },
      { id: '2', name: 'b' },
    ]) as never)
    const store = useTagStore()
    await store.load()

    store.selectAll()
    expect(store.selectedIds).toEqual(['1', '2'])
    expect(store.selectedCount).toBe(2)
  })

  it('invert toggles filtered ids and keeps non-visible selections', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([
      { id: '1', name: '电影' },
      { id: '2', name: '音乐' },
      { id: '3', name: '剧集' },
    ]) as never)
    const store = useTagStore()
    await store.load()
    store.toggle('1', true)
    store.setKeyword('音')

    store.invert()

    // “音乐”原本未选 → 选中；非可见的 “1” 保留
    expect(store.selectedIds).toEqual(['1', '2'])
  })

  it('clear empties the selection', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([{ id: '1', name: 'a' }]) as never)
    const store = useTagStore()
    await store.load()
    store.selectAll()

    store.clearSelection()

    expect(store.selectedCount).toBe(0)
  })
})

describe('useTagStore.checkName', () => {
  it('rejects empty / whitespace', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([]) as never)
    const store = useTagStore()
    await store.load()

    expect(store.checkName('')).toBe('标签名不能为空')
    expect(store.checkName('   ')).toBe('标签名不能为空')
  })

  it('rejects duplicates, excluding the edited tag itself', async () => {
    vi.mocked(tag.getLabels).mockResolvedValue(listResponse([{ id: '1', name: '电影' }]) as never)
    const store = useTagStore()
    await store.load()

    expect(store.checkName('电影')).toBe('标签名已存在')
    expect(store.checkName('电影', '1')).toBeNull()
    expect(store.checkName('音乐')).toBeNull()
  })
})
