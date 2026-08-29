// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import type { DialogConfirmOptions } from '@115master/ui'
import { DndRoot } from '@115master/ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import FileItem from '../FileItem'

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  retry: vi.fn(),
}))

vi.mock('@/app/dialog', () => ({
  useAppDialog: () => ({
    alert: vi.fn(),
    confirm: mocks.confirm,
  }),
}))

vi.mock('@/hooks/useVideoCover', () => ({
  useSmartVideoCover: () => ({
    videoCover: {
      error: new Error('cover failed'),
      isLoading: false,
      isReady: false,
      state: [],
    },
    retry: mocks.retry,
  }),
}))

vi.mock('@/utils/openFilesItem', () => ({
  openFilesItem: vi.fn(),
  resolveFileLink: () => ({ href: '#video' }),
}))

vi.mock('@/utils/actressFaceDB', () => ({
  actressFaceDB: {
    findActress: vi.fn(),
    init: vi.fn(),
  },
}))

vi.mock('@/utils/utils115', () => ({
  Utils115: {
    getFileIcon: () => 'ion:film',
  },
}))

const apps: ReturnType<typeof createApp>[] = []

beforeEach(() => {
  mocks.confirm.mockResolvedValue(false)
})

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
  mocks.confirm.mockReset()
  mocks.retry.mockReset()
})

describe('fileItem video cover error', () => {
  it('点击文件链接内的封面错误入口会打开含重试操作的 Dialog', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const data = {
      fc: 1,
      fid: 'video-a',
      ico: 'mp4',
      iv: 1,
      n: 'video-a.mp4',
      pc: 'pick-a',
      play_long: 120,
      sha: 'sha-a',
    } as Share.Entity.FilesItem
    const app = createApp(defineComponent({
      setup: () => () => h(DndRoot, null, {
        default: () => h(FileItem, { data }),
      }),
    }))
    app.mount(root)
    apps.push(app)

    root.querySelector<HTMLButtonElement>('[data-video-cover-error-action]')?.click()
    await nextTick()

    expect(mocks.confirm).toHaveBeenCalledOnce()
    const options = mocks.confirm.mock.calls[0]![0] as DialogConfirmOptions
    expect(options).toEqual(expect.objectContaining({
      title: '视频封面加载失败',
      confirmText: '重试加载',
      cancelText: '关闭',
      confirmOnEnter: false,
    }))
    const content = (options.content as () => { children: unknown })()
    expect(String(content.children)).toContain('cover failed')

    await options.onConfirm?.()
    expect(mocks.retry).toHaveBeenCalledOnce()
  })
})
