// @vitest-environment jsdom
import type { Share } from '@115master/drive115'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, createApp, defineComponent, h, shallowRef } from 'vue'
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

afterEach(() => {
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
})
