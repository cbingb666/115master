// @vitest-environment jsdom
import type { App } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick, ref, shallowRef } from 'vue'
import { useCollectionSelection } from '../useCollectionSelection'

interface Item {
  id: string
}

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

function pointer(type: string, options: MouseEventInit & { pointerType?: string } = {}) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, ...options })
  Object.defineProperty(event, 'pointerType', { value: options.pointerType ?? 'mouse' })
  return event
}

function setup(initial: Item[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const items = ref(initial)
  const selected = shallowRef(new Set<string>())
  const container = ref<HTMLElement>()
  const activate = vi.fn()
  let bind!: ReturnType<typeof useCollectionSelection<Item>>

  const app = createApp(defineComponent({
    setup() {
      bind = useCollectionSelection({
        items: () => items.value,
        key: item => item.id,
        selection: {
          has: item => selected.value.has(item.id),
          set: (item, on) => {
            const next = new Set(selected.value)
            if (on)
              next.add(item.id)
            else
              next.delete(item.id)
            selected.value = next
          },
          clear: () => selected.value = new Set(),
          size: () => selected.value.size,
        },
        container: () => container.value,
        onActivate: activate,
      })
      return () => h('div', { ref: container }, items.value.map(item => h('div', {
        ...bind.itemProps(item),
        class: 'item',
      }, [h('span', item.id)])))
    },
  }))
  app.mount(root)
  apps.push(app)

  return {
    activate,
    app,
    bind,
    container: () => container.value!,
    items,
    nodes: () => [...container.value!.querySelectorAll<HTMLElement>('.item')],
    selected,
  }
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
  vi.useRealTimers()
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('useCollectionSelection', () => {
  it('owns its marquee element through the UI namespace', async () => {
    const view = setup()
    await nextTick()

    const box = view.container().querySelector<HTMLElement>('.ui-collection-selection-box')
    expect(box).not.toBeNull()
    expect(box?.style.cssText).toBe('')
    expect(view.nodes()[0].hasAttribute('data-ui-collection-selection-key')).toBe(true)
  })

  it('activates a plain item and toggles items once selection is active', () => {
    const view = setup()
    const [a, b] = view.nodes()

    a.querySelector('span')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(view.activate).toHaveBeenCalledWith({ id: 'a' })
    expect(view.selected.value.size).toBe(0)

    view.bind.set(view.items.value[0], true)
    b.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    a.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(view.selected.value).toEqual(new Set(['b']))
    expect(view.bind.active.value).toBe(true)
  })

  it('supports Shift ranges and Cmd/Ctrl toggles through one adapter', () => {
    const view = setup()
    const [a, , c] = view.nodes()

    a.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }))
    c.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true }))
    expect(view.selected.value).toEqual(new Set(['a', 'b', 'c']))

    c.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }))
    expect(view.selected.value).toEqual(new Set(['a', 'b']))
  })

  it('handles Cmd/Ctrl+A and Escape without stealing editable text shortcuts', async () => {
    const view = setup()
    view.selected.value = new Set(['hidden'])

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', metaKey: true }))
    expect(view.selected.value).toEqual(new Set(['a', 'b', 'c']))

    document.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }))
    expect(view.selected.value.size).toBe(0)

    const input = document.createElement('input')
    view.container().appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', ctrlKey: true }))
    await nextTick()
    expect(view.selected.value.size).toBe(0)
  })

  it('selects the context item, preserves an existing multi-selection and reports menu position', () => {
    const view = setup()
    const [a, , c] = view.nodes()

    a.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 21, clientY: 34 }))
    expect(view.selected.value).toEqual(new Set(['a']))
    expect(view.bind.menu.value).toEqual({ item: { id: 'a' }, x: 21, y: 34 })

    view.bind.set(view.items.value[1], true)
    c.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, clientX: 55, clientY: 89 }))
    expect(view.selected.value).toEqual(new Set(['a', 'b', 'c']))
    expect(view.bind.menu.value?.x).toBe(55)

    view.bind.closeMenu()
    expect(view.bind.menu.value).toBeNull()
  })

  it('long-presses an item through the adapter, swallows the synthetic click and cancels on movement', async () => {
    vi.useFakeTimers()
    const view = setup()
    const [a, b] = view.nodes()

    a.dispatchEvent(pointer('pointerdown', { clientX: 20, clientY: 20, pointerType: 'touch' }))
    await vi.advanceTimersByTimeAsync(200)
    a.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(view.selected.value).toEqual(new Set(['a']))
    expect(view.activate).not.toHaveBeenCalled()

    view.bind.clear()
    b.dispatchEvent(pointer('pointerdown', { clientX: 20, clientY: 20, pointerType: 'touch' }))
    document.dispatchEvent(pointer('pointermove', { clientX: 31, clientY: 20, pointerType: 'touch' }))
    await vi.advanceTimersByTimeAsync(300)
    expect(view.selected.value.size).toBe(0)
  })

  it('marquee-selects by item geometry without finding or clicking checkboxes', async () => {
    const view = setup()
    await nextTick()
    const [a, b, c] = view.nodes()
    view.container().getBoundingClientRect = () => bounds(0, 100, 600, 500)
    a.getBoundingClientRect = () => bounds(0, 120, 600, 180)
    b.getBoundingClientRect = () => bounds(0, 220, 600, 280)
    c.getBoundingClientRect = () => bounds(0, 320, 600, 380)
    view.bind.set(view.items.value[2], true)

    view.container().dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 300, clientY: 110 }))
    view.container().dispatchEvent(new MouseEvent('mousemove', { bubbles: true, button: 0, clientX: 300, clientY: 290 }))

    expect(view.container().querySelector('input')).toBeNull()
    expect(view.selected.value).toEqual(new Set(['a', 'b']))

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
    a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(view.selected.value).toEqual(new Set(['a', 'b']))
    a.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(view.selected.value).toEqual(new Set(['b']))
  })

  it('keeps modifier selections and absorbs newly mounted items while edge-scrolling', async () => {
    let offset = 0
    vi.stubGlobal('innerHeight', 500)
    vi.stubGlobal('scrollBy', vi.fn((_x: number, y: number) => offset += y))
    const view = setup([{ id: 'a' }, { id: 'b' }])
    await nextTick()
    view.container().getBoundingClientRect = () => bounds(0, 100 - offset, 600, 1100 - offset)
    const [a, b] = view.nodes()
    a.getBoundingClientRect = () => bounds(0, 200 - offset, 600, 260 - offset)
    b.getBoundingClientRect = () => bounds(0, 500 - offset, 600, 560 - offset)
    view.bind.set(view.items.value[1], true)

    view.container().dispatchEvent(new MouseEvent('mousedown', {
      bubbles: true,
      button: 0,
      clientX: 300,
      clientY: 150,
      ctrlKey: true,
    }))
    view.container().dispatchEvent(new MouseEvent('mousemove', {
      bubbles: true,
      button: 0,
      clientX: 300,
      clientY: 495,
      ctrlKey: true,
    }))
    runFrame()

    expect(offset).toBeGreaterThan(0)
    expect(view.selected.value).toEqual(new Set(['a', 'b']))

    view.items.value = [...view.items.value, { id: 'c' }]
    await nextTick()
    const c = view.nodes()[2]
    c.getBoundingClientRect = () => bounds(0, 505 - offset, 600, 565 - offset)
    runFrame()
    expect(view.selected.value).toEqual(new Set(['a', 'b', 'c']))

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
  })

  it('clears selection on a short blank click but not on an interactive control', async () => {
    const view = setup()
    await nextTick()
    view.bind.set(view.items.value[0], true)

    const button = document.createElement('button')
    view.container().appendChild(button)
    button.dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }))
    button.dispatchEvent(pointer('pointerup', { clientX: 10, clientY: 10 }))
    expect(view.selected.value).toEqual(new Set(['a']))

    view.container().dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }))
    view.container().dispatchEvent(pointer('pointerup', { clientX: 10, clientY: 10 }))
    expect(view.selected.value.size).toBe(0)
  })
})
