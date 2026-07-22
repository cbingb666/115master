// @vitest-environment jsdom
import type { VNode } from 'vue'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { useDndSession, useDndSource, useDndTarget } from '../useDnd'

/** jsdom 无 PointerEvent 构造器；用 MouseEvent 携带坐标并按需注入 pointerType */
function pointer(type: string, x: number, y: number, pointerType?: string) {
  const e = new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true })
  if (pointerType)
    Object.defineProperty(e, 'pointerType', { value: pointerType })
  return e
}

function rectEl(rect: { left: number, top: number, right: number, bottom: number }) {
  const el = document.createElement('div')
  el.getBoundingClientRect = () => ({
    ...rect,
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  })
  document.body.appendChild(el)
  return el
}

function source() {
  const el = document.createElement('div')
  document.body.appendChild(el)
  return el
}

const stops: Array<() => void> = []

beforeAll(() => {
  globalThis.requestAnimationFrame = cb => setTimeout(cb, 16) as unknown as number
  globalThis.cancelAnimationFrame = id => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
})

afterEach(() => {
  document.dispatchEvent(pointer('pointercancel', 0, 0))
  stops.splice(0).forEach(stop => stop())
  document.body.innerHTML = ''
})

function start(x: number, y: number, pointerType?: string) {
  const payload = vi.fn(() => ['a'])
  const { onPointerdown } = useDndSource({ payload, ghost: () => ({}) as VNode })
  const el = source()
  el.addEventListener('pointerdown', onPointerdown as EventListener)
  el.dispatchEvent(pointer('pointerdown', x, y, pointerType))
  return payload
}

describe('useDndSource', () => {
  it('位移超过阈值才激活会话，payload 惰性求值', () => {
    const payload = start(100, 100)
    expect(payload).not.toHaveBeenCalled()

    document.dispatchEvent(pointer('pointermove', 103, 103))
    expect(payload).not.toHaveBeenCalled()
    expect(useDndSession().active.value).toBe(false)

    document.dispatchEvent(pointer('pointermove', 110, 100))
    expect(payload).toHaveBeenCalledTimes(1)
    expect(useDndSession().active.value).toBe(true)
  })

  it('disabled 时不启动', () => {
    const { onPointerdown } = useDndSource({
      payload: () => ['a'],
      ghost: () => ({}) as VNode,
      disabled: () => true,
    })
    const el = source()
    el.addEventListener('pointerdown', onPointerdown as EventListener)
    el.dispatchEvent(pointer('pointerdown', 100, 100))
    document.dispatchEvent(pointer('pointermove', 200, 200))
    expect(useDndSession().active.value).toBe(false)
  })

  it('触摸阈值为 10px（9px 不激活）', () => {
    start(100, 100, 'touch')
    document.dispatchEvent(pointer('pointermove', 109, 100, 'touch'))
    expect(useDndSession().active.value).toBe(false)
    document.dispatchEvent(pointer('pointermove', 111, 100, 'touch'))
    expect(useDndSession().active.value).toBe(true)
  })

  it('未过阈值抬起视为普通点击，不激活', () => {
    start(100, 100)
    document.dispatchEvent(pointer('pointerup', 101, 101))
    expect(useDndSession().active.value).toBe(false)
  })
})

describe('useDndTarget', () => {
  it('命中目标并 drop 触发 onDrop(payload)', () => {
    const onDrop = vi.fn()
    const el = rectEl({ left: 100, top: 100, right: 200, bottom: 200 })
    const t = useDndTarget<string[]>({ id: 't1', el: () => el, accept: () => true, onDrop })
    stops.push(t.stop)

    start(50, 50)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    expect(useDndSession().session.value?.targetId).toBe('t1')
    expect(t.hovering.value).toBe(true)

    document.dispatchEvent(pointer('pointerup', 150, 150))
    expect(onDrop).toHaveBeenCalledWith(['a'])
    expect(useDndSession().active.value).toBe(false)
  })

  it('accept 拒绝时不命中', () => {
    const onDrop = vi.fn()
    const el = rectEl({ left: 100, top: 100, right: 200, bottom: 200 })
    const t = useDndTarget<string[]>({ id: 't1', el: () => el, accept: () => false, onDrop })
    stops.push(t.stop)

    start(50, 50)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    expect(useDndSession().session.value?.targetId).toBeNull()
    document.dispatchEvent(pointer('pointerup', 150, 150))
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('落在目标外抬起不 drop', () => {
    const onDrop = vi.fn()
    const el = rectEl({ left: 100, top: 100, right: 200, bottom: 200 })
    const t = useDndTarget<string[]>({ id: 't1', el: () => el, accept: () => true, onDrop })
    stops.push(t.stop)

    start(50, 50)
    document.dispatchEvent(pointer('pointermove', 300, 300))
    document.dispatchEvent(pointer('pointerup', 300, 300))
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('pointercancel 清理会话且不 drop', () => {
    const onDrop = vi.fn()
    const el = rectEl({ left: 100, top: 100, right: 200, bottom: 200 })
    const t = useDndTarget<string[]>({ id: 't1', el: () => el, accept: () => true, onDrop })
    stops.push(t.stop)

    start(50, 50)
    document.dispatchEvent(pointer('pointermove', 150, 150))
    document.dispatchEvent(pointer('pointercancel', 150, 150))
    expect(useDndSession().active.value).toBe(false)
    expect(onDrop).not.toHaveBeenCalled()
  })

  it('拖拽到视口边缘触发自动滚动', async () => {
    window.scrollBy = vi.fn()
    const el = rectEl({ left: 100, top: 100, right: 200, bottom: 200 })
    const t = useDndTarget<string[]>({ id: 't1', el: () => el, accept: () => true, onDrop: () => {} })
    stops.push(t.stop)

    start(50, 50)
    document.dispatchEvent(pointer('pointermove', 150, 4))
    await new Promise(r => setTimeout(r, 60))
    expect(window.scrollBy).toHaveBeenCalled()
    expect((window.scrollBy as ReturnType<typeof vi.fn>).mock.calls[0][1]).toBeLessThan(0)
  })
})
