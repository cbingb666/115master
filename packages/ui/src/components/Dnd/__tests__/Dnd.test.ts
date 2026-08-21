// @vitest-environment jsdom
import type { App } from 'vue'
import { DndMonitor, DndRoot, DndSource, DndTarget } from '@115master/ui'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'

interface FixtureOptions {
  accept?: (payload: unknown) => boolean
  disabled?: (event: PointerEvent) => boolean
  drop?: (payload: unknown) => void
  payload?: () => unknown
}

const apps: App[] = []

/** jsdom 无 PointerEvent 构造器；用 MouseEvent 注入 pointerType。 */
function pointer(type: string, x: number, y: number, pointerType = 'mouse') {
  const event = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  return event
}

function rect(el: Element, value: { left: number, top: number, right: number, bottom: number }) {
  el.getBoundingClientRect = () => ({
    ...value,
    width: value.right - value.left,
    height: value.bottom - value.top,
    x: value.left,
    y: value.top,
    toJSON: () => ({}),
  })
}

function mount(options: FixtureOptions = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp(defineComponent({
    setup: () => () => h(DndRoot, null, {
      default: () => [
        h(DndSource, {
          payload: options.payload ?? (() => ['a']),
          disabled: options.disabled ?? (() => false),
        }, {
          default: ({ sourceProps }: { sourceProps: Record<string, unknown> }) => h('div', { id: 'source', ...sourceProps }),
          ghost: ({ payload }: { payload: unknown }) => h('div', { id: 'ghost' }, JSON.stringify(payload)),
        }),
        h(DndTarget, {
          accept: options.accept ?? (() => true),
          onDrop: options.drop ?? (() => {}),
        }, {
          default: ({ targetProps, hovering }: { targetProps: Record<string, unknown>, hovering: boolean }) => h('div', {
            'id': 'target',
            ...targetProps,
            'data-hovering': hovering,
          }),
        }),
        h(DndMonitor, null, {
          default: ({ active }: { active: boolean }) => h('span', { 'id': 'monitor', 'data-active': active }),
        }),
      ],
    }),
  }))
  app.mount(root)
  apps.push(app)
  rect(root.querySelector('#target')!, { left: 100, top: 100, right: 200, bottom: 200 })
  return root
}

function start(root: Element, x = 50, y = 50, pointerType = 'mouse') {
  root.querySelector('#source')!.dispatchEvent(pointer('pointerdown', x, y, pointerType))
}

beforeAll(() => {
  globalThis.requestAnimationFrame = callback => setTimeout(callback, 16) as unknown as number
  globalThis.cancelAnimationFrame = id => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
})

afterEach(() => {
  document.dispatchEvent(pointer('pointercancel', 0, 0))
  vi.unstubAllGlobals()
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
})

describe('dndSource', () => {
  it('超过鼠标阈值后才惰性求值 payload，并通过 Root 渲染 ghost', async () => {
    const payload = vi.fn(() => ['a'])
    const root = mount({ payload })
    start(root, 100, 100)

    document.dispatchEvent(pointer('pointermove', 103, 103))
    await nextTick()
    expect(payload).not.toHaveBeenCalled()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')

    document.dispatchEvent(pointer('pointermove', 110, 100))
    await nextTick()
    expect(payload).toHaveBeenCalledTimes(1)
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('true')
    expect(root.querySelector('#ghost')?.textContent).toBe('["a"]')
  })

  it('disabled 时不启动', async () => {
    const root = mount({ disabled: () => true })
    start(root, 100, 100)
    document.dispatchEvent(pointer('pointermove', 200, 200))
    await nextTick()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')
  })

  it('拖拽激活期间使用 grabbing 光标', async () => {
    const root = mount()
    start(root)
    document.dispatchEvent(pointer('pointermove', 60, 50))
    await nextTick()

    expect(root.querySelector('[data-ui-dnd-cursor]')?.classList).toContain('cursor-grabbing')

    document.dispatchEvent(pointer('pointerup', 60, 50))
    await nextTick()
    expect(root.querySelector('[data-ui-dnd-cursor]')).toBeNull()
  })

  it('触摸阈值为 10px', async () => {
    const root = mount()
    start(root, 100, 100, 'touch')
    document.dispatchEvent(pointer('pointermove', 109, 100, 'touch'))
    await nextTick()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')

    document.dispatchEvent(pointer('pointermove', 110, 100, 'touch'))
    await nextTick()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('true')
  })

  it('未过阈值抬起仍是普通点击', async () => {
    const root = mount()
    start(root, 100, 100)
    document.dispatchEvent(pointer('pointerup', 101, 101))
    await nextTick()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')
  })
})

describe('dndTarget', () => {
  it('跨 realm 元素仍可作为投放目标', async () => {
    const frame = document.createElement('iframe')
    document.body.appendChild(frame)
    vi.stubGlobal('HTMLElement', (frame.contentWindow as Window & typeof globalThis).HTMLElement)
    const drop = vi.fn()
    const root = mount({ drop })

    start(root)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    await nextTick()
    expect(root.querySelector('#target')?.getAttribute('data-hovering')).toBe('true')

    document.dispatchEvent(pointer('pointerup', 150, 150))
    expect(drop).toHaveBeenCalledWith(['a'])
  })

  it('命中目标会公开 hovering，并在释放时触发 drop', async () => {
    const drop = vi.fn()
    const root = mount({ drop })
    start(root)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    await nextTick()
    expect(root.querySelector('#target')?.getAttribute('data-hovering')).toBe('true')

    document.dispatchEvent(pointer('pointerup', 150, 150))
    await nextTick()
    expect(drop).toHaveBeenCalledWith(['a'])
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')
  })

  it('accept 拒绝时不命中', async () => {
    const drop = vi.fn()
    const root = mount({ accept: () => false, drop })
    start(root)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    await nextTick()
    expect(root.querySelector('#target')?.getAttribute('data-hovering')).toBe('false')

    document.dispatchEvent(pointer('pointerup', 150, 150))
    expect(drop).not.toHaveBeenCalled()
  })

  it('目标外释放不触发 drop', () => {
    const drop = vi.fn()
    const root = mount({ drop })
    start(root)
    document.dispatchEvent(pointer('pointermove', 300, 300))
    document.dispatchEvent(pointer('pointerup', 300, 300))
    expect(drop).not.toHaveBeenCalled()
  })

  it('pointercancel 清理会话且不 drop', async () => {
    const drop = vi.fn()
    const root = mount({ drop })
    start(root)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    document.dispatchEvent(pointer('pointercancel', 150, 150))
    await nextTick()
    expect(root.querySelector('#monitor')?.getAttribute('data-active')).toBe('false')
    expect(drop).not.toHaveBeenCalled()
  })

  it('拖到视口边缘触发自动滚动', async () => {
    window.scrollBy = vi.fn()
    const root = mount()
    start(root)
    document.dispatchEvent(pointer('pointermove', 150, 4))
    await new Promise(resolve => setTimeout(resolve, 60))
    expect(window.scrollBy).toHaveBeenCalled()
    expect((window.scrollBy as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBeLessThan(0)
  })
})
