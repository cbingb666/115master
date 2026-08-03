import type { Share } from '@115master/drive115'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { drive115 } from '@/utils/drive115Instance'
import { pageCache, useDriveStore } from '../index'

const storage = vi.hoisted(() => ({
  mode: 'pagination',
  size: 256,
}))

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    file: {
      getFilesWithFallback: vi.fn(),
      searchFiles: vi.fn(),
      setFilesOrder: vi.fn(),
    },
  },
}))

vi.mock('@/app/router', () => ({
  router: {
    currentRoute: { value: { name: 'drive', params: {}, query: {} } },
    push: vi.fn(),
    afterEach: vi.fn(() => () => {}),
    beforeEach: vi.fn(() => () => {}),
  },
}))

// node 环境无真实 router/window，query/nav/storage 用 ref 替身
vi.mock('@vueuse/router', () => ({
  useRouteQuery: (_key: string, def: unknown) => ref(def),
}))
vi.mock('@vueuse/core', () => ({
  useStorage: (key: string, def: unknown) => ref(
    key === '115Master_drive_list_load_mode'
      ? storage.mode
      : key === '115Master_pageSize' ? storage.size : def,
  ),
}))
/** 共享的导航 area ref（星标跨目录测试用，store 每次创建都读同一 ref） */
const navArea = ref('all')
vi.mock('@/hooks/useDriveNav', () => ({
  usePathNav: () => ({
    cid: ref('0'),
    area: navArea,
    direction: ref('forward'),
  }),
}))

const file = drive115.file

function item(fid: string, extra: Partial<Share.Entity.FilesItem> = {}): Share.Entity.FilesItem {
  return { fid, cid: '', n: `file-${fid}`, fc: 1, pc: fid, ...extra } as Share.Entity.FilesItem
}

function filesRes(items: Share.Entity.FilesItem[], total = items.length) {
  return {
    state: true,
    code: 0,
    message: '',
    count: total,
    file_count: items.length,
    folder_count: 0,
    is_asc: 0,
    order: 'user_ptime',
    fc_mix: 0,
    offset: 0,
    cur: 1,
    data: items,
    path: [],
  } as unknown as Awaited<ReturnType<typeof file.getFilesWithFallback>>
}

beforeEach(() => {
  setActivePinia(createPinia())
  pageCache.clear()
  navArea.value = 'all'
  storage.mode = 'pagination'
  storage.size = 256
  vi.clearAllMocks()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('driveStore SWR', () => {
  it('缓存命中 → 状态立即为缓存数据（同步），loader 仍被调用（后台校验）', async () => {
    const items = [item('a'), item('b')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()

    // 首次加载填充缓存
    await store.navigate(1)
    expect(store.data?.data).toHaveLength(2)

    /** 新 loader 返回更新数据 */
    const updated = [item('a'), item('b'), item('c')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(updated, 3))

    const promise = store.navigate(1)
    // 同步阶段：命中缓存，立即渲染旧数据
    expect(store.data?.data).toHaveLength(2)
    await promise
    // SWR 校验完成 → 替换为新数据
    expect(store.data?.data).toHaveLength(3)
    expect(file.getFilesWithFallback).toHaveBeenCalled()
  })

  it('generation：先发的慢请求后返回 → 状态不被旧响应覆盖', async () => {
    type Res = Awaited<ReturnType<typeof file.getFilesWithFallback>>
    let resolveSlow!: (v: Res) => void
    const slow = new Promise<Res>((r) => {
      resolveSlow = r
    })
    vi.mocked(file.getFilesWithFallback).mockReturnValueOnce(slow)
    const store = useDriveStore()

    const first = store.navigate(1)
    // 第二次 navigate 使第一次的 generation 过期
    vi.mocked(file.getFilesWithFallback).mockResolvedValueOnce(filesRes([item('new')]))
    const second = store.navigate(2)

    resolveSlow(filesRes([item('old')]))
    await first
    await second

    const names = store.data?.data?.map(i => i.n)
    expect(names).not.toContain('file-old')
  })

  it('请求去重：pageCache.fetch 同 key 并发复用同一 loader Promise', async () => {
    // store 层 navigate 每次 generation++，去重实际由 pageCache.fetch 的 in-flight 保证（Seam 1 已覆盖）。
    // 这里验证 store 快速连续 navigate 同页不会导致状态错乱（过期响应被 generation 丢弃）。
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes([item('a')]))
    const store = useDriveStore()
    await Promise.all([store.navigate(1), store.navigate(1)])
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-a'])
  })

  it('无限加载逐页追加，并保持已加载项顺序', async () => {
    storage.mode = 'infinite'
    storage.size = 2
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes([item('a'), item('b')], 4))
    const store = useDriveStore()

    await vi.waitFor(() => expect(store.loading).toBe(false))
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-a', 'file-b'])
    expect(store.hasMore).toBe(true)

    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes([item('c'), item('d')], 4))
    await store.loadMore()

    expect(file.getFilesWithFallback).toHaveBeenLastCalledWith(expect.objectContaining({ offset: 2, limit: 2 }))
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-a', 'file-b', 'file-c', 'file-d'])
    expect(store.hasMore).toBe(false)

    store.applyRemoveMutation([item('a')])
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-b', 'file-c', 'file-d'])
    expect(store.total).toBe(3)
  })
})

describe('driveStore applyMutation', () => {
  it('remove → 当前页 items 减少、total 减少', async () => {
    const items = [item('a'), item('b'), item('c')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)
    expect(store.total).toBe(3)

    store.applyRemoveMutation([items[0]])
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-b', 'file-c'])
    expect(store.total).toBe(2)
  })

  it('update（重命名）→ 就地更新名字，total 不变', async () => {
    const items = [item('a'), item('b')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)

    store.applyUpdateMutation(item('a', { n: 'renamed', pc: 'a' }))
    expect(store.data?.data?.[0]?.n).toBe('renamed')
    expect(store.total).toBe(2)
  })

  it('共享缓存一致性：applyMutation 后 FileBroswer 参数（不同 size/fc/nf）查询同 cid 不命中旧数据', async () => {
    const items = [item('a'), item('b')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)

    store.applyRemoveMutation([items[0]])

    // drive 页缓存已被重排（remove 'a'）；FileBroswer 用不同 size/fc/nf 查询同 cid，
    // 其 key 不同 → 不命中 drive 页缓存 → 触发新拉取（由 pageCache.fetch 去重决定）
    /** 这里验证 pageCache 中 drive key 已重排 */
    const { cacheKey } = await import('../cache')
    const driveKey = cacheKey({
      area: 'all',
      cid: '0',
      page: 1,
      size: store.query.size,
      order: 'user_ptime',
      asc: 0,
      fc_mix: 0,
      suffix: '',
      type: '',
      fc: '',
      nf: '',
    })
    const browserKey = cacheKey({
      area: 'all',
      cid: '0',
      page: 1,
      size: 20,
      order: 'user_ptime',
      asc: 0,
      fc_mix: 0,
      suffix: '',
      type: '',
      fc: '1',
      nf: '1',
    })
    expect(driveKey).not.toBe(browserKey)
    const cached = pageCache.get(driveKey)
    expect(cached?.items.map(i => i.n)).toEqual(['file-b'])
  })
})

describe('driveStore 排序变更', () => {
  it('changeSort → 该 cid 旧缓存失效 + 拉取新排序', async () => {
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes([item('a')]))
    vi.mocked(file.setFilesOrder).mockResolvedValue({ state: true, code: 0, message: '' } as never)
    const store = useDriveStore()
    await store.navigate(1)

    const { cacheKey } = await import('../cache')
    const oldKey = cacheKey({
      area: 'all',
      cid: '0',
      page: 1,
      size: store.query.size,
      order: 'user_ptime',
      asc: 0,
      fc_mix: 0,
      suffix: '',
      type: '',
      fc: '',
      nf: '',
    })
    expect(pageCache.get(oldKey)).toBeDefined()

    // changeSort 后服务器按新排序返回
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(
      filesRes([item('a')]) && { ...filesRes([item('a')]), order: 'file_name', is_asc: 1 } as never,
    )
    await store.changeSort('file_name', 1, 0)
    expect(pageCache.get(oldKey)).toBeUndefined()
    expect(file.setFilesOrder).toHaveBeenCalled()
  })
})

describe('driveStore 星标跨目录', () => {
  it('star 区 filepath 固定显示星标', async () => {
    navArea.value = 'star'
    vi.mocked(file.getFilesWithFallback).mockResolvedValue({
      ...filesRes([item('a', { m: 1 })]),
      path: [{ cid: '0', name: '根目录' } as Share.Entity.PathItem],
    })
    const store = useDriveStore()

    await store.navigate(1)

    expect(file.getFilesWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ star: 1 }),
    )
    expect(store.path).toEqual([
      expect.objectContaining({ cid: '0', name: '星标' }),
    ])
  })

  it('all 区星标 → 就地更新 m 字段，total 不变', async () => {
    const items = [item('a'), item('b')]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)

    store.applyStarMutation([items[0]])
    expect(store.data?.data?.[0]?.m).toBe(1)
    expect(store.total).toBe(2)
  })

  it('star 区取消星标 → 从列表移除，total 减少', async () => {
    navArea.value = 'star'
    const items = [item('a', { m: 1 }), item('b', { m: 1 })]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)
    expect(store.total).toBe(2)

    // 取消星标（item 当前 m=1）→ 从 star 区列表移除
    store.applyStarMutation([items[0]])
    expect(store.data?.data?.map(i => i.n)).toEqual(['file-b'])
    expect(store.total).toBe(1)
  })

  it('star 区新增星标 → 失效 star 区并刷新（插入位置服务端决定）', async () => {
    navArea.value = 'star'
    const items = [item('a', { m: 0 })]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await store.navigate(1)

    const { cacheKey } = await import('../cache')
    const starKey = cacheKey({
      area: 'star',
      cid: '0',
      page: 1,
      size: store.query.size,
      order: 'user_ptime',
      asc: 0,
      fc_mix: 0,
      suffix: '',
      type: '',
      fc: '',
      nf: '',
    })
    expect(pageCache.get(starKey)).toBeDefined()

    vi.mocked(file.getFilesWithFallback).mockClear()
    store.applyStarMutation([items[0]])
    // star 区缓存已失效 → 重新拉取
    expect(pageCache.get(starKey)).toBeUndefined()
  })
})
