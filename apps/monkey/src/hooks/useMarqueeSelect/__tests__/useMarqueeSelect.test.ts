// @vitest-environment jsdom
import type { App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, nextTick } from 'vue'
import { useMarqueeSelect } from '..'

const apps: App[] = []
const frames = new Map<number, FrameRequestCallback>()
let frame = 0

function bounds(left: number, top: number, right: number, bottom: number): DOMRect {
  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
    x: left,
    y: top,
    toJSON: () => ({}),
  }
}

function rect(el: Element, value: () => DOMRect) {
  el.getBoundingClientRect = value
}

function mouse(type: string, x: number, y: number) {
  return new MouseEvent(type, { bubbles: true, button: 0, clientX: x, clientY: y })
}

function fixture(offset = 0) {
  const scroll = document.createElement('div')
  const container = document.createElement('div')
  scroll.appendChild(container)
  document.body.appendChild(scroll)

  let top = offset
  Object.defineProperty(scroll, 'scrollTop', {
    configurable: true,
    get: () => top,
    set: value => top = value,
  })
  rect(scroll, () => bounds(0, 100, 600, 500))
  rect(container, () => bounds(0, 100 - top, 600, 1100 - top))

  const scrollBy = vi.fn((options: ScrollToOptions) => {
    top += options.top ?? 0
  })
  Object.defineProperty(scroll, 'scrollBy', { value: scrollBy })

  return {
    container,
    scroll,
    scrollBy,
    offset: () => top,
  }
}

function item(container: HTMLElement, key: string, top: number) {
  const node = document.createElement('div')
  const checkbox = document.createElement('input')
  checkbox.type = 'checkbox'
  node.dataset.selectionKey = key
  node.appendChild(checkbox)
  container.appendChild(node)
  rect(node, () => {
    const parent = container.getBoundingClientRect()
    return bounds(0, parent.top + top, 600, parent.top + top + 60)
  })
  return checkbox
}

async function mount(container: HTMLElement, scroll: HTMLElement) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp(defineComponent({
    setup() {
      useMarqueeSelect({
        container: () => container,
        scrollContainer: () => scroll,
      })
      return () => null
    },
  }))
  app.mount(root)
  apps.push(app)
  await nextTick()
}

function runFrame() {
  const callbacks = [...frames.values()]
  frames.clear()
  callbacks.forEach(callback => callback(performance.now()))
}

beforeEach(() => {
  frame = 0
  frames.clear()
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
    frames.set(++frame, callback)
    return frame
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn((id: number) => frames.delete(id)))
})

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('useMarqueeSelect', () => {
  it('框选期间不改变滚动容器的 overflow', async () => {
    const view = fixture()
    view.scroll.style.overflow = 'auto'
    await mount(view.container, view.scroll)

    view.container.dispatchEvent(mouse('mousedown', 300, 150))
    view.container.dispatchEvent(mouse('mousemove', 300, 300))

    expect(view.scroll.style.overflow).toBe('auto')
  })

  it.each([
    { name: '顶部', offset: 200, start: 350, end: 105, direction: -1 },
    { name: '底部', offset: 0, start: 150, end: 495, direction: 1 },
  ])('框选到$name时持续滚动', async ({ offset, start, end, direction }) => {
    const view = fixture(offset)
    await mount(view.container, view.scroll)

    view.container.dispatchEvent(mouse('mousedown', 300, start))
    view.container.dispatchEvent(mouse('mousemove', 300, end))
    runFrame()

    expect(view.scrollBy).toHaveBeenCalled()
    expect(Math.sign(view.scrollBy.mock.calls[0][0].top ?? 0)).toBe(direction)

    document.dispatchEvent(mouse('mouseup', 300, end))
    const calls = view.scrollBy.mock.calls.length
    runFrame()
    expect(view.scrollBy).toHaveBeenCalledTimes(calls)
  })

  it('滚动期间继续框选虚拟列表新挂载的项目', async () => {
    const view = fixture()
    const first = item(view.container, 'first', 100)
    await mount(view.container, view.scroll)

    view.container.dispatchEvent(mouse('mousedown', 300, 150))
    view.container.dispatchEvent(mouse('mousemove', 300, 495))
    expect(first.checked).toBe(true)

    const next = item(view.container, 'next', 400)
    expect(next.checked).toBe(false)
    runFrame()

    expect(view.offset()).toBeGreaterThan(0)
    expect(next.checked).toBe(true)
  })
})
