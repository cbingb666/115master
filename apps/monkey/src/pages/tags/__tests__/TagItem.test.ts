// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import TagItem from '../TagItem'

const apps: ReturnType<typeof createApp>[] = []

function mockIntersectionObserver() {
  let callback: IntersectionObserverCallback = () => {}
  let instance: IntersectionObserver

  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: IntersectionObserverCallback) {
      callback = cb
      instance = this as unknown as IntersectionObserver
    }

    observe() {}
    unobserve() {}
    disconnect() {}
  })

  return {
    show(target: Element, isIntersecting: boolean) {
      callback([{ isIntersecting, target } as IntersectionObserverEntry], instance)
    },
  }
}

function pointer(type: string, button = 0, x = 20) {
  const event = new MouseEvent(type, { bubbles: true, button, clientX: x, clientY: 20 })
  Object.defineProperty(event, 'pointerType', { value: 'mouse' })
  return event
}

function mountItem(options: {
  selected?: boolean
  selectMode?: boolean
  onToggle?: (selected: boolean) => void
  onClick?: (e: MouseEvent) => void
} = {}) {
  const root = document.createElement('div')
  document.body.appendChild(root)
  const app = createApp({
    render: () => h(TagItem, {
      tag: { id: '1', name: '电影', color: '#FF4B30', sort: 0 },
      selected: options.selected,
      selectMode: options.selectMode,
      onToggle: options.onToggle ?? vi.fn(),
      onClick: options.onClick,
      onEdit: vi.fn(),
      onDelete: vi.fn(),
    }),
  })
  app.mount(root)
  apps.push(app)
  return root
}

afterEach(() => {
  vi.useRealTimers()
  apps.splice(0).forEach(app => app.unmount())
  document.body.innerHTML = ''
})

describe('tagItem', () => {
  it('普通模式不显示也不占位 checkbox', () => {
    const root = mountItem()
    const slot = root.querySelector<HTMLElement>('[data-checkbox-slot]')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    const content = root.querySelector<HTMLElement>('[data-item-content]')!

    expect(slot.classList).toContain('w-9')
    expect(slot.classList).toContain('absolute')
    expect(slot.classList).toContain('-translate-x-9')
    expect(slot.classList).toContain('transition-transform')
    expect(slot.className).not.toContain('transition-[width]')
    expect(slot.className).not.toContain('transition-[margin-left]')
    expect(checkbox.classList).toContain('opacity-100')
    expect(checkbox.classList).not.toContain('transition-transform')
    expect(content.classList).not.toContain('translate-x-9')
    expect(checkbox.tabIndex).toBe(-1)
  })

  it('进入多选模式后 checkbox 随固定槽滑入并推开色点与名称', () => {
    const root = mountItem({ selectMode: true })
    const slot = root.querySelector<HTMLElement>('[data-checkbox-slot]')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!
    const content = root.querySelector<HTMLElement>('[data-item-content]')!

    expect(slot.classList).toContain('w-9')
    expect(slot.classList).toContain('translate-x-[var(--main-content-gutter)]')
    expect(slot.classList).not.toContain('-translate-x-9')
    expect(checkbox.classList).toContain('opacity-100')
    expect(content.classList).toContain('pl-9')
    expect(content.classList).not.toContain('translate-x-9')
    expect(content.classList).not.toContain('pr-9')
    expect(content.classList).toContain('transition-[padding-left]')
    expect(content.classList).not.toContain('transition-transform')
    expect(checkbox.tabIndex).toBe(0)
  })

  it('不可见标签项不挂载多选过渡，进入视口后恢复', async () => {
    const viewport = mockIntersectionObserver()
    const root = mountItem({ selectMode: true })
    await nextTick()
    const item = root.querySelector('li')!
    const slot = root.querySelector<HTMLElement>('[data-checkbox-slot]')!
    const content = root.querySelector<HTMLElement>('[data-item-content]')!

    expect(item.dataset.inViewport).toBe('false')
    expect(slot.classList).not.toContain('transition-transform')
    expect(content.classList).not.toContain('transition-[padding-left]')

    viewport.show(item, true)
    await nextTick()

    expect(item.dataset.inViewport).toBe('true')
    expect(slot.classList).toContain('transition-transform')
    expect(content.classList).toContain('transition-[padding-left]')
  })

  it('uses the drive list view row surface and spacing', () => {
    const root = mountItem()
    const item = root.querySelector('li')!

    expect(item.classList).toContain('rounded-xs')
    expect(item.classList).toContain('even:bg-base-content/[0.03]')
    expect(item.classList).toContain('dark:even:bg-base-content/5')
    expect(item.classList).toContain('hover:bg-base-content/5')
    expect(item.classList).toContain('min-h-14')
    expect(item.classList).toContain('px-(--main-content-gutter)')
    expect(item.classList).toContain('[content-visibility:auto]')
    expect(item.classList).toContain('[contain-intrinsic-block-size:auto_3.5rem]')

    const color = item.querySelector<HTMLElement>('[data-color-slot]')!
    expect(color.classList).toContain('mr-3')
    expect(color.classList).toContain('size-4')
  })

  it('pc 端鼠标左键长按进入多选并吞掉随后的 click', async () => {
    vi.useFakeTimers()
    const toggle = vi.fn()
    const click = vi.fn()
    const root = mountItem({ onToggle: toggle, onClick: click })
    await nextTick()

    root.querySelector('li')!.dispatchEvent(pointer('pointerdown'))
    await vi.advanceTimersByTimeAsync(200)
    root.querySelector('li')!.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(toggle).toHaveBeenCalledWith(true)
    expect(click).not.toHaveBeenCalled()
  })

  it('鼠标右键长按不进入多选', async () => {
    vi.useFakeTimers()
    const toggle = vi.fn()
    const root = mountItem({ onToggle: toggle })
    await nextTick()

    root.querySelector('li')!.dispatchEvent(pointer('pointerdown', 2))
    await vi.advanceTimersByTimeAsync(300)

    expect(toggle).not.toHaveBeenCalled()
  })

  it('达到框选阈值时取消长按计时', async () => {
    vi.useFakeTimers()
    const toggle = vi.fn()
    const root = mountItem({ onToggle: toggle })
    await nextTick()

    root.querySelector('li')!.dispatchEvent(pointer('pointerdown'))
    document.dispatchEvent(pointer('pointermove', 0, 30))
    await vi.advanceTimersByTimeAsync(300)

    expect(toggle).not.toHaveBeenCalled()
  })
})
