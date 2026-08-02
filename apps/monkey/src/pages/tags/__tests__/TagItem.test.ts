// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import TagItem from '../TagItem'

const apps: ReturnType<typeof createApp>[] = []

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

    expect(slot.classList).toContain('w-0')
    expect(slot.classList).toContain('pointer-events-none')
    expect(slot.classList).toContain('transition-[width]')
    expect(slot.classList).toContain('duration-300')
    expect(checkbox.classList).toContain('opacity-0')
    expect(checkbox.classList).toContain('transition-opacity')
    expect(checkbox.classList).toContain('group-data-[select-mode=true]:opacity-100')
    expect(checkbox.tabIndex).toBe(-1)
  })

  it('进入多选模式后显示 checkbox', () => {
    const root = mountItem({ selectMode: true })
    const slot = root.querySelector<HTMLElement>('[data-checkbox-slot]')!
    const checkbox = root.querySelector<HTMLInputElement>('input[type="checkbox"]')!

    expect(slot.classList).toContain('w-9')
    expect(slot.classList).not.toContain('w-0')
    expect(checkbox.tabIndex).toBe(0)
  })

  it('uses the drive list view row surface and spacing', () => {
    const root = mountItem()
    const item = root.querySelector('li')!

    expect(item.classList).toContain('rounded-xs')
    expect(item.classList).toContain('even:bg-base-content/[0.03]')
    expect(item.classList).toContain('dark:even:bg-base-content/5')
    expect(item.classList).toContain('hover:bg-base-content/5')
    expect(item.classList).toContain('min-h-14')
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
