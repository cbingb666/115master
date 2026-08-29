// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, shallowRef } from 'vue'
import { useSmartVideoCover } from '..'

const scheduler = vi.hoisted(() => ({
  add: vi.fn(),
  cancel: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}))

vi.mock('@vueuse/core', async () => {
  const { shallowRef } = await import('vue')
  return {
    useElementVisibility: () => shallowRef(false),
    useScroll: () => ({ isScrolling: shallowRef(false) }),
  }
})

vi.mock('@/utils/scheduler', () => ({
  Scheduler: class {
    add = scheduler.add
    cancel = scheduler.cancel
    get = scheduler.get
    remove = scheduler.remove
  },
  SchedulerError: {
    TaskCancelled: class extends Error {},
  },
  TaskStatus: {
    Pending: 'pending',
  },
}))

vi.mock('@/utils/cache', () => ({
  videoCoverCache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}))

vi.mock('@/utils/clipper/m3u8Clipper', () => ({
  M3U8ClipperNew: class {},
}))

vi.mock('@/utils/drive115Instance', () => ({
  drive115: {
    video: {
      getM3u8: vi.fn(),
    },
  },
}))

afterEach(() => {
  scheduler.add.mockReset()
  scheduler.cancel.mockReset()
  scheduler.get.mockReset()
  scheduler.remove.mockReset()
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('useSmartVideoCover', () => {
  it('重试时移除旧任务、清空错误并重新调度封面', async () => {
    const generated = [{
      img: 'blob:retried-cover',
      width: 1280,
      height: 720,
      frameTime: 24,
      seekTime: 24,
    }]
    scheduler.add.mockResolvedValue(generated)
    scheduler.get.mockReturnValue(undefined)
    vi.stubGlobal('URL', {
      ...URL,
      revokeObjectURL: vi.fn(),
    })

    let result: ReturnType<typeof useSmartVideoCover> | undefined
    const root = document.createElement('div')
    document.body.appendChild(root)
    const app = createApp(defineComponent({
      setup() {
        result = useSmartVideoCover(shallowRef({
          sha1: 'sha-a',
          pickCode: 'pick-a',
          coverNum: 1,
          duration: 120,
        }), { elementRef: shallowRef<HTMLElement>() })
        return () => h('div')
      },
    }))
    app.mount(root)
    result!.videoCover.error = new Error('first load failed')

    await result!.retry()

    expect(scheduler.remove).toHaveBeenCalledWith('cover_sha-a_pick-a_1_120')
    expect(scheduler.add).toHaveBeenCalledOnce()
    expect(result!.videoCover.error).toBeUndefined()
    expect(result!.videoCover.isLoading).toBe(false)
    expect(result!.videoCover.isReady).toBe(true)
    expect(result!.videoCover.state).toEqual(generated)

    app.unmount()
  })
})
