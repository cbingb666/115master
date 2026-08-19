import type { Api, Share } from '@115master/drive115'
import type { Pinia } from 'pinia'
import { createPinia, disposePinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { drive115 } from '@/utils/drive115Instance'
import { useDriveStore } from '../index'

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

vi.mock('@vueuse/router', () => ({
  useRouteQuery: (_key: string, defaultValue: unknown) => ref(defaultValue),
}))
vi.mock('@vueuse/core', () => ({
  useStorage: (key: string, defaultValue: unknown) => ref(
    key === '115Master_drive_list_load_mode'
      ? storage.mode
      : key === '115Master_pageSize' ? storage.size : defaultValue,
  ),
}))

const navArea = ref('all')
const navCid = ref('0')
vi.mock('@/hooks/useDriveNav', () => ({
  usePathNav: () => ({
    cid: navCid,
    area: navArea,
  }),
}))

const file = drive115.file
let pinia: Pinia

function item(fid: string, extra: Partial<Share.Entity.FilesItem> = {}): Share.Entity.FilesItem {
  return { fid, cid: '', n: `file-${fid}`, fc: 1, pc: fid, ...extra } as Share.Entity.FilesItem
}

function filesRes(
  items: Share.Entity.FilesItem[],
  total = items.length,
  extra: Partial<Api.FileApi.Res.Files> = {},
) {
  return {
    state: true,
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
    ...extra,
  } as Awaited<ReturnType<typeof file.getFilesWithFallback>>
}

beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
  navArea.value = 'all'
  navCid.value = '0'
  storage.mode = 'pagination'
  storage.size = 256
  vi.clearAllMocks()
})

afterEach(() => {
  disposePinia(pinia)
  vi.clearAllMocks()
})

describe('driveStore query', () => {
  it('自动加载当前分页，并把 AbortSignal 传到客户端', async () => {
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes([item('a')]))

    const store = useDriveStore()

    await vi.waitFor(() => expect(store.data?.data.map(value => value.n)).toEqual(['file-a']))
    expect(file.getFilesWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ cid: '0', offset: 0, limit: 256 }),
      expect.anything(),
    )
    expect(store.loading).toBe(false)
  })

  it('同 key 刷新期间保留旧数据，完成后原位替换', async () => {
    vi.mocked(file.getFilesWithFallback).mockResolvedValueOnce(filesRes([item('a')]))
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data).toHaveLength(1))

    type Response = Awaited<ReturnType<typeof file.getFilesWithFallback>>
    let resolveRefresh!: (response: Response) => void
    vi.mocked(file.getFilesWithFallback).mockReturnValueOnce(new Promise((resolve) => {
      resolveRefresh = resolve
    }))

    const refreshing = store.refresh()
    await vi.waitFor(() => expect(store.refreshing).toBe(true))
    expect(store.data?.data.map(value => value.n)).toEqual(['file-a'])

    resolveRefresh(filesRes([item('a'), item('b')], 2))
    await refreshing
    expect(store.data?.data.map(value => value.n)).toEqual(['file-a', 'file-b'])
  })

  it('切页取消旧请求，迟到响应不会覆盖新页', async () => {
    type Response = Awaited<ReturnType<typeof file.getFilesWithFallback>>
    let resolveSlow!: (response: Response) => void
    vi.mocked(file.getFilesWithFallback).mockImplementation((params) => {
      if (params.offset === 0) {
        return new Promise((resolve) => {
          resolveSlow = resolve
        })
      }
      return Promise.resolve(filesRes([item('new')], 300, { offset: params.offset, cur: 2 }))
    })
    const store = useDriveStore()
    await vi.waitFor(() => expect(file.getFilesWithFallback).toHaveBeenCalledTimes(1))
    const firstSignal = vi.mocked(file.getFilesWithFallback).mock.calls[0][1]

    store.changePage(2)

    await vi.waitFor(() => expect(store.data?.data.map(value => value.n)).toEqual(['file-new']))
    expect(firstSignal?.aborted).toBe(true)
    resolveSlow(filesRes([item('old')]))
    await Promise.resolve()
    expect(store.data?.data.map(value => value.n)).toEqual(['file-new'])
  })

  it('返回已访问目录时重新请求，不复用旧结果', async () => {
    vi.mocked(file.getFilesWithFallback).mockImplementation(params => Promise.resolve(
      filesRes([item(params.cid === '0' ? 'root' : 'child')]),
    ))
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data[0]?.n).toBe('file-root'))

    navCid.value = '100'
    await vi.waitFor(() => expect(store.data?.data[0]?.n).toBe('file-child'))
    navCid.value = '0'
    await vi.waitFor(() => expect(store.data?.data[0]?.n).toBe('file-root'))

    expect(vi.mocked(file.getFilesWithFallback).mock.calls.filter(([params]) => params.cid === '0')).toHaveLength(2)
  })

  it('无限模式刷新时重新请求当前已加载页', async () => {
    storage.mode = 'infinite'
    storage.size = 2
    let removed = false
    vi.mocked(file.getFilesWithFallback).mockImplementation(params => Promise.resolve(removed
      ? params.offset === 0
        ? filesRes([item('b'), item('c')], 3)
        : filesRes([item('d')], 3, { offset: 2, cur: 2 })
      : params.offset === 0
        ? filesRes([item('a'), item('b')], 4)
        : filesRes([item('c'), item('d')], 4, { offset: 2, cur: 2 })))
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data.map(value => value.n)).toEqual(['file-a', 'file-b']))

    await store.loadMore()

    expect(store.data?.data.map(value => value.n)).toEqual(['file-a', 'file-b', 'file-c', 'file-d'])
    expect(store.hasMore).toBe(false)
    removed = true
    const refresh = store.afterAction()
    expect(store.data?.data.map(value => value.n)).toEqual(['file-a', 'file-b', 'file-c', 'file-d'])
    await refresh
    expect(store.data?.data.map(value => value.n)).toEqual(['file-b', 'file-c', 'file-d'])
    expect(store.total).toBe(3)
  })
})

describe('driveStore actions', () => {
  it('操作后保留当前画面，完成重新请求后替换', async () => {
    vi.mocked(file.getFilesWithFallback)
      .mockResolvedValueOnce(filesRes([item('a')]))
      .mockResolvedValueOnce(filesRes([item('b')]))
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data[0]?.n).toBe('file-a'))

    const refresh = store.afterAction()
    expect(store.data?.data[0]?.n).toBe('file-a')
    await refresh

    expect(store.data?.data[0]?.n).toBe('file-b')
  })

  it('changeSort 按新规则重新请求', async () => {
    vi.mocked(file.getFilesWithFallback)
      .mockResolvedValueOnce(filesRes([item('a')]))
      .mockResolvedValue(filesRes([item('a')], 1, { order: 'file_name', is_asc: 1 }))
    vi.mocked(file.setFilesOrder).mockResolvedValue({ state: true } as never)
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data).toHaveLength(1))

    await store.changeSort('file_name', 1, 0)

    expect(file.setFilesOrder).toHaveBeenCalledWith(expect.objectContaining({ user_order: 'file_name' }))
    expect(file.getFilesWithFallback).toHaveBeenLastCalledWith(
      expect.objectContaining({ o: 'file_name', asc: 1 }),
      expect.anything(),
    )
  })

  it('star 区使用星标参数与虚拟路径', async () => {
    navArea.value = 'star'
    const items = [item('a', { m: 1 }), item('b', { m: 1 })]
    vi.mocked(file.getFilesWithFallback).mockResolvedValue(filesRes(items))
    const store = useDriveStore()
    await vi.waitFor(() => expect(store.data?.data).toHaveLength(2))

    expect(file.getFilesWithFallback).toHaveBeenCalledWith(
      expect.objectContaining({ star: 1 }),
      expect.anything(),
    )
    expect(store.path).toEqual([expect.objectContaining({ name: '星标' })])
  })
})
