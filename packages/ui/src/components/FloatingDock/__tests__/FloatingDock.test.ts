// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, ref } from 'vue'
import { FloatingDock } from '../FloatingDock'

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  vi.unstubAllGlobals()
})

describe('floatingDock', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class {
      observe() {}
      disconnect() {}
      unobserve() {}
    })
  })

  it('is hidden until content is selected', () => {
    const host = document.createElement('div')
    const app = createApp(FloatingDock)
    app.mount(host)
    apps.push(app)

    expect(host.querySelector('[data-ui-floating-dock]')).toBeNull()
  })

  it('keeps one Glass surface while keyed content changes', async () => {
    const host = document.createElement('div')
    const key = ref<'actions' | 'pagination'>('actions')
    const app = createApp({
      setup: () => () => h(
        FloatingDock,
        { contentKey: key.value },
        { default: () => h('div', key.value) },
      ),
    })
    app.mount(host)
    apps.push(app)

    const surface = host.querySelector('[data-ui-floating-dock]')
    expect(surface?.classList).toContain('ui-glass-floating')
    expect(host.querySelectorAll('.ui-glass-floating')).toHaveLength(1)

    key.value = 'pagination'
    await nextTick()

    expect(host.querySelector('[data-ui-floating-dock]')).toBe(surface)
    expect(host.querySelectorAll('.ui-glass-floating')).toHaveLength(1)
    expect(host.textContent).toContain('pagination')
  })

  it('tracks keyed content dimensions on the continuous surface', async () => {
    let callback: ResizeObserverCallback = () => {}
    let target: Element | undefined

    vi.stubGlobal('ResizeObserver', class {
      constructor(next: ResizeObserverCallback) {
        callback = next
      }

      observe(element: Element) {
        target = element
      }

      disconnect() {}
      unobserve() {}
    })

    const host = document.createElement('div')
    const app = createApp({
      setup: () => () => h(
        FloatingDock,
        { contentKey: 'actions' },
        { default: () => h('div', 'Actions') },
      ),
    })
    app.mount(host)
    apps.push(app)
    await nextTick()

    if (!target)
      throw new Error('FloatingDock did not observe its content')

    Object.defineProperties(target, {
      offsetHeight: { configurable: true, value: 48 },
      offsetWidth: { configurable: true, value: 120 },
    })
    callback(
      [{ target } as ResizeObserverEntry],
      {} as ResizeObserver,
    )
    await nextTick()

    expect(host.querySelector<HTMLElement>('[data-ui-floating-dock]')?.style.height).toBe('48px')
    expect(host.querySelector<HTMLElement>('[data-ui-floating-dock]')?.style.width).toBe('120px')
  })
})
