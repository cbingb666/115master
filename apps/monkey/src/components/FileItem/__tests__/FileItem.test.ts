// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, shallowRef } from 'vue'
import DndRoot from '../../Dnd/DndRoot'
import FileItem from '../FileItem'

vi.hoisted(() => {
  class MediaErrorStub {
    static readonly MEDIA_ERR_ABORTED = 1
    static readonly MEDIA_ERR_NETWORK = 2
    static readonly MEDIA_ERR_DECODE = 3
    static readonly MEDIA_ERR_SRC_NOT_SUPPORTED = 4
  }

  Object.defineProperty(globalThis, 'MediaError', {
    configurable: true,
    value: MediaErrorStub,
  })
})

vi.mock('../useFileItem', () => ({
  useFileItem: () => ({
    itemRef: shallowRef<HTMLElement>(),
    isVideo: computed(() => false),
    isFolder: computed(() => false),
    link: computed(() => ({ href: '#file' })),
    hasActressCover: computed(() => false),
    hasVideoCover: computed(() => false),
    hasImagePreview: computed(() => false),
    actressAsyncState: {
      isReady: shallowRef(true),
      state: shallowRef(null),
    },
    videoCoverResult: null,
    open: vi.fn(),
  }),
}))

vi.mock('../FileItemThumbnail', () => ({
  default: {
    name: 'FileItemThumbnailStub',
    render: () => null,
  },
}))

const apps: ReturnType<typeof createApp>[] = []

function pointer(type: string, pointerType = 'touch', x = 20) {
  const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: 20 })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

function mountItem(options: {
  checked?: boolean
  onChecked?: (checked: boolean) => void
  selectMode?: boolean
} = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const data = {
    fc: 1,
    fid: 'file-a',
    iv: 0,
    n: 'file-a.txt',
    pc: 'pick-a',
  } as Share.Entity.FilesItem
  const app = createApp(defineComponent({
    setup: () => () => h(DndRoot, null, {
      default: () => h(FileItem, {
        data,
        ...options,
      }, {
        thumbnail: () => h('span', { id: 'thumbnail' }, 'file'),
      }),
    }),
  }))
  app.mount(root)
  apps.push(app)
  return root
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
})

describe('fileItem', () => {
  it('把框选标识透传到真实根元素', () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const data = {
      fc: 1,
      fid: 'file-a',
      iv: 0,
      n: 'file-a.txt',
      pc: 'pick-a',
    } as Share.Entity.FilesItem
    const app = createApp(defineComponent({
      setup: () => () => h(DndRoot, null, {
        default: () => h(FileItem, {
          'data': data,
          'data-selection-key': 'pick-a',
        }, {
          thumbnail: () => h('span', 'file'),
        }),
      }),
    }))
    app.mount(root)
    apps.push(app)

    expect(root.querySelector('[data-selection-key="pick-a"]')).not.toBeNull()
  })

  it('列表视图在勾选框与缩略图之间保留足够间距', () => {
    const root = mountItem()
    const label = root.querySelector('label')!

    expect(label.classList).toContain('group-data-[view-type=list]:pl-1')
    expect(label.classList).toContain('group-data-[view-type=list]:pr-3')
  })

  it('卡片视图为未选中勾选框提供暗色封面上的对比底色', () => {
    const root = mountItem()
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(checkbox.classList).toContain('group-data-[view-type=card]:bg-white/85')
    expect(checkbox.classList).toContain('group-data-[view-type=card]:border-black/25')
    expect(checkbox.classList).toContain('focus-visible:opacity-100')
  })

  it('卡片视图的选中勾选框只使用 primary 反馈', () => {
    const root = mountItem({ checked: true })
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(checkbox.classList).not.toContain('group-data-[view-type=card]:bg-white/85')
    expect(checkbox.classList).toContain('checked:bg-primary')
  })

  it('跨 realm 的移动端文件项长按会进入多选', async () => {
    vi.useFakeTimers()
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    vi.stubGlobal('HTMLElement', (frame.contentWindow as Window & typeof globalThis).HTMLElement)
    const checked = vi.fn()
    const root = mountItem({ onChecked: checked })
    await nextTick()

    root.querySelector('#thumbnail')!.dispatchEvent(pointer('pointerdown'))
    await vi.advanceTimersByTimeAsync(199)
    expect(checked).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)

    expect(checked).toHaveBeenCalledWith(true)
  })

  it('多选态不再启动长按计时器', async () => {
    vi.useFakeTimers()
    const checked = vi.fn()
    const root = mountItem({ onChecked: checked, selectMode: true })
    await nextTick()

    root.querySelector('#thumbnail')!.dispatchEvent(pointer('pointerdown'))
    await vi.advanceTimersByTimeAsync(500)

    expect(checked).not.toHaveBeenCalled()
  })

  it('触摸位移达到 10px 时取消长按，避免与拖拽边界重叠', async () => {
    vi.useFakeTimers()
    const checked = vi.fn()
    const root = mountItem({ onChecked: checked })
    await nextTick()

    root.querySelector('#thumbnail')!.dispatchEvent(pointer('pointerdown'))
    document.dispatchEvent(pointer('pointermove', 'touch', 30))
    await vi.advanceTimersByTimeAsync(500)

    expect(checked).not.toHaveBeenCalled()
  })
})
