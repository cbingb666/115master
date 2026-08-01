// @vitest-environment jsdom

import type { ImageLoader, ImageResource } from '@/utils/imageLoader'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, shallowReactive } from 'vue'
import Image from '../Image'

vi.mock('../../LoadingError/LoadingError', async () => {
  const vue = await import('vue')
  return {
    default: vue.defineComponent({
      name: 'LoadingErrorStub',
      setup: () => () => vue.h('div', { 'data-loading-error': '' }),
    }),
  }
})

const apps: ReturnType<typeof createApp>[] = []

interface TestProps {
  src: string
  alt?: string
  loader?: ImageLoader
  lazy?: boolean
  class?: string
  style?: string
}

function mount(values: TestProps) {
  const host = document.createElement('div')
  const props = shallowReactive(values)
  const app = createApp({
    setup: () => () => h(Image, {
      src: props.src,
      alt: props.alt,
      loader: props.loader,
      lazy: props.lazy,
      class: props.class,
      style: props.style,
    }),
  })
  app.mount(host)
  apps.push(app)
  return { app, host, props }
}

async function flush() {
  for (let i = 0; i < 8; i++)
    await Promise.resolve()
  await new Promise(resolve => setTimeout(resolve, 0))
  await nextTick()
}

function resource(src: string, dispose?: () => void): ImageResource {
  return { src, dispose }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('image', () => {
  it('keeps the newest src when an older loader request finishes last', async () => {
    const slow = deferred<ImageResource>()
    const fast = deferred<ImageResource>()
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(src => src === 'slow' ? slow.promise : fast.promise),
    }
    const view = mount({ src: 'slow', loader })
    await flush()
    view.props.src = 'fast'
    await flush()

    fast.resolve(resource('fast-result'))
    await flush()
    slow.resolve(resource('slow-result'))
    await flush()

    expect(view.host.querySelector('img')?.getAttribute('src')).toBe('fast-result')
  })

  it('clears the previous image while the next loader request is pending', async () => {
    const next = deferred<ImageResource>()
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(src => src === 'first' ? Promise.resolve(resource('first-result')) : next.promise),
    }
    const view = mount({ src: 'first', loader })
    await flush()
    view.props.src = 'next'
    await flush()

    expect(view.host.querySelector('img')).toBeNull()
    expect(view.host.querySelector('.skeleton')).not.toBeNull()
  })

  it('waits for visibility before invoking a lazy loader', async () => {
    let show: IntersectionObserverCallback = () => {}
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        show = callback
      }

      observe() {}
      disconnect() {}
    })
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(async () => resource('loaded')),
    }
    const view = mount({ src: 'remote', loader, lazy: true })
    await flush()
    expect(loader.load).not.toHaveBeenCalled()

    show([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    await flush()
    expect(loader.load).toHaveBeenCalledOnce()
    expect(view.host.querySelector('img')?.getAttribute('src')).toBe('loaded')
  })

  it('waits for visibility when a lazy loader is attached later', async () => {
    let show: IntersectionObserverCallback = () => {}
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: IntersectionObserverCallback) {
        show = callback
      }

      observe() {}
      disconnect() {}
    })
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(async () => resource('loaded')),
    }
    const view = mount({ src: 'remote', lazy: true })
    await flush()
    view.props.loader = loader
    await flush()

    expect(loader.load).not.toHaveBeenCalled()

    show([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    await flush()
    expect(loader.load).toHaveBeenCalledOnce()
    expect(view.host.querySelector('img')?.getAttribute('src')).toBe('loaded')
  })

  it('shows the fallback when a loader returns an empty source', async () => {
    const dispose = vi.fn()
    const loader: ImageLoader = {
      key: 'empty',
      load: vi.fn(async () => resource('', dispose)),
    }
    const view = mount({ src: 'remote', loader })
    await flush()

    expect(dispose).toHaveBeenCalledOnce()
    expect(view.host.firstElementChild?.getAttribute('aria-busy')).toBeNull()
    expect(view.host.querySelector('[data-loading-error]')).not.toBeNull()
  })

  it('reloads the same src when the loader key changes', async () => {
    const first: ImageLoader = {
      key: 'first',
      load: vi.fn(async () => resource('first-result')),
    }
    const second: ImageLoader = {
      key: 'second',
      load: vi.fn(async () => resource('second-result')),
    }
    const view = mount({ src: 'same', loader: first })
    await flush()
    view.props.loader = second
    await flush()

    expect(second.load).toHaveBeenCalledOnce()
    expect(view.host.querySelector('img')?.getAttribute('src')).toBe('second-result')
  })

  it('forwards class and style to the root container', async () => {
    const view = mount({ src: 'image', class: 'size-12', style: 'width: 12px' })
    await flush()

    expect(view.host.firstElementChild?.classList).toContain('size-12')
    expect(view.host.firstElementChild?.getAttribute('style')).toBe('width: 12px;')
  })

  it('exposes an accessible failure label', async () => {
    const loader: ImageLoader = {
      key: 'error',
      load: vi.fn(async () => { throw new Error('broken') }),
    }
    const view = mount({ src: 'broken', alt: '影片封面', loader })
    await flush()

    expect(view.host.firstElementChild?.getAttribute('role')).toBe('img')
    expect(view.host.firstElementChild?.getAttribute('aria-label')).toBe('影片封面加载失败')
  })

  it('disposes loader resources when the source changes and on unmount', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(async src => resource(`${src}-result`, src === 'first' ? first : second)),
    }
    const view = mount({ src: 'first', loader })
    await flush()
    view.props.src = 'second'
    await flush()
    expect(first).toHaveBeenCalledOnce()

    view.app.unmount()
    apps.splice(apps.indexOf(view.app), 1)
    expect(second).toHaveBeenCalledOnce()
  })

  it('continues loading when resource disposal throws', async () => {
    const dispose = vi.fn()
      .mockImplementationOnce(() => { throw new Error('dispose failed') })
    const loader: ImageLoader = {
      key: 'remote',
      load: vi.fn(async src => resource(`${src}-result`, dispose)),
    }
    const view = mount({ src: 'first', loader })
    view.app.config.errorHandler = () => {}
    await flush()
    view.props.src = 'second'
    await flush()

    expect(loader.load).toHaveBeenCalledTimes(2)
    expect(view.host.querySelector('img')?.getAttribute('src')).toBe('second-result')
  })
})
