// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import { DndRoot } from '@115master/ui'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
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

function mockIntersectionObserver() {
  let callback: IntersectionObserverCallback = () => {}
  let instance: IntersectionObserver
  const created = vi.fn()
  const observe = vi.fn()

  vi.stubGlobal('IntersectionObserver', class {
    observe = observe
    unobserve = vi.fn()
    disconnect = vi.fn()

    constructor(cb: IntersectionObserverCallback) {
      callback = cb
      instance = this as unknown as IntersectionObserver
      created()
    }
  })

  return {
    created,
    observe,
    show(target: Element, isIntersecting: boolean) {
      callback([{ isIntersecting, target } as IntersectionObserverEntry], instance)
    },
  }
}

function mountItem(options: {
  checked?: boolean
  dragPayload?: () => Share.Entity.FilesItem[]
  onChecked?: (checked: boolean) => void
  selectMode?: boolean
  viewType?: 'card' | 'list'
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
          'data-ui-collection-selection-key': 'pick-a',
        }, {
          thumbnail: () => h('span', 'file'),
        }),
      }),
    }))
    app.mount(root)
    apps.push(app)

    expect(root.querySelector('[data-ui-collection-selection-key="pick-a"]')).not.toBeNull()
  })

  it('列表视图普通模式不显示也不占位 checkbox', () => {
    const root = mountItem()
    const label = root.querySelector('label')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(label.classList).toContain('group-data-[view-type=list]:w-9')
    expect(label.classList).toContain('group-data-[view-type=list]:absolute')
    expect(label.classList).toContain('group-data-[view-type=list]:-translate-x-9')
    expect(label.classList).toContain('group-data-[view-type=list]:transition-transform')
    expect(label.className).not.toContain('transition-[width]')
    expect(label.className).not.toContain('transition-[margin-left]')
    expect(label.classList).toContain('pointer-events-none')
    expect(checkbox.classList).toContain('group-data-[view-type=list]:opacity-100')
    expect(checkbox.className).not.toContain('group-data-[view-type=list]:transition-transform')
    expect(checkbox.tabIndex).toBe(-1)
  })

  it('列表视图进入多选模式后 checkbox 随固定槽滑入并推开原内容', () => {
    const root = mountItem({ selectMode: true })
    const label = root.querySelector('label')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    const link = root.querySelector('a')!

    expect(label.classList).toContain('group-data-[view-type=list]:w-9')
    expect(label.classList).toContain('group-data-[view-type=list]:translate-x-[var(--main-content-gutter)]')
    expect(label.classList).not.toContain('group-data-[view-type=list]:-translate-x-9')
    expect(label.classList).not.toContain('pointer-events-none')
    expect(checkbox.classList).toContain('group-data-[view-type=list]:opacity-100')
    expect(link.classList).toContain('pl-9')
    expect(link.classList).not.toContain('translate-x-9')
    expect(link.classList).not.toContain('pr-9')
    expect(link.classList).toContain('group-data-[view-type=list]:transition-[padding-left]')
    expect(link.classList).not.toContain('group-data-[view-type=list]:transition-transform')
    expect(checkbox.tabIndex).toBe(0)
  })

  it('卡片视图多选时不应用列表内容位移', () => {
    const root = mountItem({ selectMode: true, viewType: 'card' })
    const link = root.querySelector('a')!

    expect(link.classList).not.toContain('pl-9')
  })

  it('切换列表视图时不复用带有旧 opacity 状态的 checkbox', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const viewType = ref<'card' | 'list'>('list')
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
          viewType: viewType.value,
        }),
      }),
    }))
    app.mount(root)
    apps.push(app)

    const listCheckbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    expect(listCheckbox.classList).toContain('group-data-[view-type=list]:opacity-100')

    viewType.value = 'card'
    await nextTick()

    const cardCheckbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    expect(cardCheckbox).not.toBe(listCheckbox)
    expect(cardCheckbox.classList).toContain('group-data-[view-type=card]:opacity-0')
  })

  it('不可见列表项不挂载多选过渡，进入视口后恢复', async () => {
    const viewport = mockIntersectionObserver()
    const root = mountItem({ selectMode: true })
    await nextTick()
    const item = root.querySelector<HTMLElement>('[data-view-type="list"]')!
    const label = root.querySelector('label')!
    const link = root.querySelector('a')!

    expect(item.dataset.inViewport).toBe('false')
    expect(label.classList).not.toContain('group-data-[view-type=list]:transition-transform')
    expect(link.classList).not.toContain('group-data-[view-type=list]:transition-[padding-left]')

    viewport.show(item, true)
    await nextTick()

    expect(item.dataset.inViewport).toBe('true')
    expect(label.classList).toContain('group-data-[view-type=list]:transition-transform')
    expect(link.classList).toContain('group-data-[view-type=list]:transition-[padding-left]')
  })

  it('大量列表项共享一个视口 observer', async () => {
    const viewport = mockIntersectionObserver()

    mountItem()
    mountItem()
    await nextTick()

    expect(viewport.created).toHaveBeenCalledOnce()
    expect(viewport.observe).toHaveBeenCalledTimes(2)
  })

  it('列表视图的末列时间向右边界对齐', () => {
    const root = mountItem()
    const time = root.querySelector<HTMLElement>('.app-font-time')!

    expect(time.classList).toContain('group-data-[view-type=list]:text-right')
  })

  it('多选态文件主体使用 pointer 光标', () => {
    const root = mountItem({ selectMode: true })
    const link = root.querySelector('a')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(link.classList).toContain('group-data-[select-mode=true]:cursor-pointer')
    expect(link.classList).toContain('focus:outline-none')
    expect(link.classList).toContain('focus-visible:outline-2')
    expect(checkbox.classList).toContain('group-data-[view-type=list]:opacity-100')
    expect(checkbox.className).not.toContain('group-data-[view-type=list]:transition-transform')
    expect(checkbox.classList).not.toContain('group-hover:opacity-100')
  })

  it('卡片视图为未选中勾选框提供暗色封面上的对比底色', () => {
    const root = mountItem()
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(checkbox.classList).toContain('group-data-[view-type=card]:bg-white/85')
    expect(checkbox.classList).toContain('group-data-[view-type=card]:border-black/25')
  })

  it('卡片视图的选中勾选框只使用 primary 反馈', () => {
    const root = mountItem({ checked: true })
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(checkbox.classList).not.toContain('group-data-[view-type=card]:bg-white/85')
    expect(checkbox.classList).toContain('checked:bg-primary')
  })
})
