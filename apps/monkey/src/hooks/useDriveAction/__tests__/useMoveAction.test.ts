import type { Share } from '@115master/drive115'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useMoveAction } from '../useMoveAction'

const mocks = vi.hoisted(() => ({
  alert: vi.fn(),
  confirm: vi.fn(),
  getFilesMoveProgress: vi.fn(),
  moveFiles: vi.fn(),
  open: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/app/dialog', () => ({
  useAppDialog: () => ({
    alert: mocks.alert,
    confirm: mocks.confirm,
  }),
}))

vi.mock('@/components', () => ({
  useFileBrowserDialog: () => ({ open: mocks.open }),
  useToast: () => ({ error: mocks.toastError }),
}))

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    file: {
      getFilesMoveProgress: mocks.getFilesMoveProgress,
      moveFiles: mocks.moveFiles,
    },
  },
}))

function item(fid: string, name: string) {
  return { fid, n: name } as Share.Entity.FilesItem
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.confirm.mockResolvedValue(true)
  mocks.moveFiles.mockResolvedValue({ state: true })
  mocks.getFilesMoveProgress.mockResolvedValue({ progress: 100 })
})

describe('useMoveAction dragMove', () => {
  it('取消确认时保留选择且不请求移动', async () => {
    mocks.confirm.mockResolvedValue(false)
    const onConfirm = vi.fn()

    await expect(useMoveAction().dragMove('20', [item('1', '电影.mp4')], onConfirm)).resolves.toBe(false)

    expect(mocks.confirm).toHaveBeenCalledWith({
      title: '确认移动',
      content: '确定将“电影.mp4”移动到目标文件夹吗？',
      confirmText: '移动',
    })
    expect(onConfirm).not.toHaveBeenCalled()
    expect(mocks.moveFiles).not.toHaveBeenCalled()
  })

  it('确认后退出选择并移动全部拖拽项', async () => {
    const onConfirm = vi.fn()
    const items = [item('1', '电影.mp4'), item('2', '字幕.srt')]

    await expect(useMoveAction().dragMove('20', items, onConfirm)).resolves.toBe(true)

    expect(mocks.confirm).toHaveBeenCalledWith({
      title: '确认移动',
      content: '确定将选中的 2 项移动到目标文件夹吗？',
      confirmText: '移动',
    })
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(mocks.moveFiles).toHaveBeenCalledWith({
      'pid': '20',
      'fid[0]': '1',
      'fid[1]': '2',
      'move_proid': expect.any(String),
    })
  })
})
