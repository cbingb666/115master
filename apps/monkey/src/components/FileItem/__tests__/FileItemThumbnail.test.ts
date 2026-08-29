// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import FileItemThumbnail from '../FileItemThumbnail'

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
  vdi: 0,
} as Share.Entity.FilesItem

function mount(props: Record<string, unknown>) {
  const root = document.createElement('div')
  root.dataset.viewType = 'card'
  document.body.appendChild(root)
  const app = createApp({
    render: () => h(FileItemThumbnail, {
      data,
      isFolder: false,
      isVideo: true,
      hasImagePreview: false,
      ...props,
    }),
  })
  app.mount(root)
  apps.push(app)
  return root
}

function action(label: string) {
  return [...document.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')]
    .find(item => item.textContent?.includes(label))
}

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    matches: true,
    media: '(min-width: 40rem)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })))
})

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('fileItemThumbnail', () => {
  it('视频封面生成期间立即显示骨架，图片加载完成后再显示封面', async () => {
    const root = mount({ videoCoverLoading: true })

    expect(root.querySelector('[data-video-cover-skeleton]')).not.toBeNull()
    expect(root.querySelector('img')).toBeNull()

    const cover = {
      img: 'blob:cover-a',
      width: 1280,
      height: 720,
    }
    apps[apps.length - 1]?.unmount()
    apps.pop()
    root.remove()
    const ready = mount({ videoCover: cover })
    const image = ready.querySelector<HTMLImageElement>('img')!

    expect(ready.querySelector('[data-video-cover-skeleton]')).not.toBeNull()
    image.dispatchEvent(new Event('load'))
    await nextTick()

    expect(ready.querySelector('[data-video-cover-skeleton]')).toBeNull()
    expect(image.classList).toContain('opacity-100')
    expect(ready.querySelector('[data-video-cover]')?.classList).toContain('bg-black')
    expect(ready.querySelector('[data-video-cover]')?.classList).toContain('border')
  })

  it('骨架屏圆角处不暴露黑色封面底层', () => {
    const root = mount({ videoCoverLoading: true })
    const cover = root.querySelector<HTMLElement>('[data-video-cover]')!

    expect(root.querySelector('[data-video-cover-skeleton]')).not.toBeNull()
    expect(cover.classList).not.toContain('bg-black')
    expect(cover.classList).not.toContain('border')
  })

  it('加载失败时回退文件图标，并从右上角错误入口查看详情', async () => {
    vi.stubGlobal('alert', vi.fn())
    const error = new Error('decoder unavailable')
    const root = mount({ videoCoverError: error })
    const trigger = root.querySelector<HTMLButtonElement>('[data-video-cover-error-action]')!

    expect(root.querySelector('[data-video-cover]')).toBeNull()
    expect(trigger).not.toBeNull()

    trigger.click()
    await nextTick()
    action('查看错误详情')?.click()

    expect(alert).toHaveBeenCalledWith(expect.stringContaining('decoder unavailable'))
  })

  it('封面图片失败后也回退图标，并允许重新生成封面', async () => {
    const retry = vi.fn()
    const root = mount({
      videoCover: {
        img: 'blob:broken-cover',
        width: 1280,
        height: 720,
      },
      onVideoCoverRetry: retry,
    })
    root.querySelector('img')?.dispatchEvent(new Event('error'))
    await nextTick()

    const trigger = root.querySelector<HTMLButtonElement>('[data-video-cover-error-action]')!
    expect(root.querySelector('[data-video-cover]')).toBeNull()
    expect(trigger).not.toBeNull()

    trigger.click()
    await nextTick()
    action('重试加载')?.click()
    await nextTick()

    expect(retry).toHaveBeenCalledOnce()
    expect(root.querySelector('[data-video-cover-skeleton]')).not.toBeNull()
  })
})
