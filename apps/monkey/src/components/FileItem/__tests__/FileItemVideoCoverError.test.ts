// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import type { DialogConfirmOptions } from '@115master/ui'
import { DndRoot } from '@115master/ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import FileItem from '../FileItem'

const mocks = vi.hoisted(() => ({
  confirm: vi.fn(),
  error: '视频未转码，无法获取封面' as Error | string,
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
      error: mocks.error,
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

function mountItem() {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp(defineComponent({
    setup: () => () => h(DndRoot, null, {
      default: () => h(FileItem, { data }),
    }),
  }))
  app.mount(root)
  apps.push(app)
  return root
}

beforeEach(() => {
  mocks.error = '视频未转码，无法获取封面'
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
    const root = mountItem()

    root.querySelector<HTMLButtonElement>('[data-video-cover-error-action]')?.click()
    await nextTick()

    expect(mocks.confirm).toHaveBeenCalledOnce()
    const options = mocks.confirm.mock.calls[0]![0] as DialogConfirmOptions
    expect(options).toEqual(expect.objectContaining({
      title: '视频封面加载失败',
      content: '视频未转码，无法获取封面',
      confirmText: '重试加载',
      cancelText: '关闭',
      confirmOnEnter: false,
    }))
    await options.onConfirm?.()
    expect(mocks.retry).toHaveBeenCalledOnce()
  })

  it('真实异常默认只显示摘要，并折叠技术详情', async () => {
    mocks.error = new Error('decoder unavailable')
    const root = mountItem()

    root.querySelector<HTMLButtonElement>('[data-video-cover-error-action]')?.click()
    await nextTick()

    const options = mocks.confirm.mock.calls[0]![0] as DialogConfirmOptions
    const content = (options.content as () => ReturnType<typeof h>)()
    const target = document.createElement('div')
    document.body.appendChild(target)
    const app = createApp({ render: () => content })
    app.mount(target)
    apps.push(app)

    expect(target.textContent).toContain('decoder unavailable')
    expect(target.textContent).toContain('技术详情')
    expect(target.querySelector('details')?.hasAttribute('open')).toBe(false)
  })
})
