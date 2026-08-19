import type { Share } from '@115master/drive115'
import type { EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, ref } from 'vue'
import { drive115 } from '@/utils/drive115Instance'
import { useDriveList } from '../index'

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    file: {
      getFilesWithFallback: vi.fn(),
      searchFiles: vi.fn(),
      setFilesOrder: vi.fn(),
    },
  },
}))

const file = drive115.file
let scope: EffectScope

function item(fid: string): Share.Entity.FilesItem {
  return { fid, cid: '', n: `file-${fid}`, fc: 1, pc: fid } as unknown as Share.Entity.FilesItem
}

function filesRes(items: Share.Entity.FilesItem[], total = items.length) {
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
  } as unknown as Awaited<ReturnType<typeof file.getFilesWithFallback>>
}

beforeEach(() => {
  scope = effectScope()
  vi.clearAllMocks()
})

afterEach(() => {
  scope.stop()
})

describe('useDriveList', () => {
  it('直接暴露归一化 items，并在来源变化时回到第一页', async () => {
    const cid = ref('0')
    const page = ref(2)
    const size = ref(20)
    vi.mocked(file.getFilesWithFallback).mockImplementation(params => Promise.resolve(
      filesRes([item(`${params.cid}-${params.offset}`)], 40),
    ))

    const list = scope.run(() => useDriveList({
      source: { area: 'all', cid },
      page,
      size,
    }))!

    await vi.waitFor(() => expect(list.items.value[0]?.n).toBe('file-0-20'))
    expect(page.value).toBe(2)

    cid.value = '100'

    await vi.waitFor(() => expect(list.items.value[0]?.n).toBe('file-100-0'))
    expect(page.value).toBe(1)
    expect(file.getFilesWithFallback).toHaveBeenLastCalledWith(
      expect.objectContaining({ cid: '100', offset: 0, limit: 20 }),
      expect.anything(),
    )
  })
})
