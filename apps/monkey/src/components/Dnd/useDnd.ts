import type { VNode } from 'vue'
import { computed, getCurrentInstance, onBeforeUnmount, readonly, shallowRef } from 'vue'

/**
 * Pointer Events 驱动的自研拖拽（替代原生 HTML5 DnD）
 * - 原生拖拽图的半透明/白底/外框由浏览器渲染且不可控，且 iOS 基本不可用
 * - 鼠标/触摸统一走 pointer 事件；触摸默认在多选态等场景由调用方 disabled 控制
 */

interface Session {
  payload: unknown
  ghost: () => VNode
  pointerType: string
  x: number
  y: number
  targetId: string | null
  offset: { x: number, y: number }
}

interface Target {
  id: string
  el: () => HTMLElement | undefined
  accept: (payload: unknown) => boolean
  onDrop: (payload: unknown) => void
}

const session = shallowRef<Session | null>(null)
const targets = new Set<Target>()

const THRESHOLD_MOUSE = 6
const THRESHOLD_TOUCH = 10
/** 自动滚动触发边距与每帧最大速度 */
const EDGE = 48
const SPEED = 12

let scroller: HTMLElement | Window | null = null
let raf = 0

function nearestScroller(el: HTMLElement | null): HTMLElement | Window {
  let cur = el?.parentElement
  while (cur) {
    const { overflowY } = getComputedStyle(cur)
    if (/auto|scroll/.test(overflowY) && cur.scrollHeight > cur.clientHeight)
      return cur
    cur = cur.parentElement
  }
  return window
}

function hit(x: number, y: number, payload: unknown): Target | null {
  for (const t of targets) {
    const el = t.el()
    if (!el?.isConnected)
      continue
    const r = el.getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom && t.accept(payload))
      return t
  }
  return null
}

/** 拖拽结束后吞掉源元素上合成的 click（与 pointerup 同轮事件序列，超时未触发则撤除） */
function swallowClick() {
  const onClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
    document.removeEventListener('click', onClick, true)
  }
  document.addEventListener('click', onClick, true)
  setTimeout(() => document.removeEventListener('click', onClick, true), 0)
}

function autoScroll() {
  const s = session.value
  if (!s)
    return
  const top = s.y < EDGE
  const bottom = s.y > window.innerHeight - EDGE
  if (top || bottom) {
    const ratio = top ? 1 - s.y / EDGE : 1 - (window.innerHeight - s.y) / EDGE
    const dy = Math.ceil(SPEED * ratio) * (top ? -1 : 1)
    if (scroller === window)
      window.scrollBy(0, dy)
    else
      scroller?.scrollBy({ top: dy })
    /** 滚动改变目标位置，重新命中 */
    const t = hit(s.x, s.y, s.payload)
    session.value = { ...session.value!, targetId: t?.id ?? null }
  }
  raf = requestAnimationFrame(autoScroll)
}

function clearDrag() {
  cancelAnimationFrame(raf)
  scroller = null
  document.documentElement.style.userSelect = ''
  document.removeEventListener('pointermove', move)
  document.removeEventListener('pointerup', drop)
  document.removeEventListener('pointercancel', cancel)
  document.removeEventListener('touchmove', prevent)
}

function move(e: PointerEvent) {
  const s = session.value
  if (!s)
    return
  const t = hit(e.clientX, e.clientY, s.payload)
  session.value = { ...s, x: e.clientX, y: e.clientY, targetId: t?.id ?? null }
}

function drop() {
  const s = session.value
  clearDrag()
  session.value = null
  swallowClick()
  if (!s?.targetId)
    return
  for (const t of targets) {
    if (t.id === s.targetId) {
      t.onDrop(s.payload)
      return
    }
  }
}

function cancel() {
  clearDrag()
  session.value = null
}

function prevent(e: Event) {
  e.preventDefault()
}

export interface DndSourceOptions<T> {
  /** 拖拽激活时惰性求值（长按等先决状态可能已改变选中集） */
  payload: () => T
  ghost: (payload: T) => VNode
  /** 跟随图锚点（相对图左上），缺省图中心 */
  offset?: { x: number, y: number }
  disabled?: (e: PointerEvent) => boolean
}

export function useDndSource<T>(options: DndSourceOptions<T>) {
  function onPointerdown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0)
      return
    if (options.disabled?.(e))
      return

    const x = e.clientX
    const y = e.clientY
    const threshold = e.pointerType === 'touch' ? THRESHOLD_TOUCH : THRESHOLD_MOUSE

    function pending(ev: PointerEvent) {
      if (Math.hypot(ev.clientX - x, ev.clientY - y) < threshold)
        return
      clearPending()
      const payload = options.payload()
      if (Array.isArray(payload) && payload.length === 0)
        return
      session.value = {
        payload,
        ghost: () => options.ghost(payload),
        pointerType: ev.pointerType,
        x: ev.clientX,
        y: ev.clientY,
        targetId: hit(ev.clientX, ev.clientY, payload)?.id ?? null,
        offset: options.offset ?? { x: 0, y: 0 },
      }
      scroller = nearestScroller(ev.target as HTMLElement)
      document.documentElement.style.userSelect = 'none'
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', drop)
      document.addEventListener('pointercancel', cancel)
      document.addEventListener('touchmove', prevent, { passive: false })
      raf = requestAnimationFrame(autoScroll)
    }

    function clearPending() {
      document.removeEventListener('pointermove', pending)
      document.removeEventListener('pointerup', clearPending)
      document.removeEventListener('pointercancel', clearPending)
    }

    document.addEventListener('pointermove', pending)
    document.addEventListener('pointerup', clearPending)
    document.addEventListener('pointercancel', clearPending)
  }

  return { onPointerdown }
}

export interface DndTargetOptions<T> {
  id: string
  el: () => HTMLElement | undefined
  accept: (payload: T) => boolean
  onDrop: (payload: T) => void
}

export function useDndTarget<T>(options: DndTargetOptions<T>) {
  const target: Target = {
    id: options.id,
    el: options.el,
    accept: p => options.accept(p as T),
    onDrop: p => options.onDrop(p as T),
  }
  targets.add(target)
  const stop = () => targets.delete(target)
  // 组件内自动注销；模块级单测等场景手动 stop
  if (getCurrentInstance())
    onBeforeUnmount(stop)

  return {
    hovering: computed(() => session.value?.targetId === options.id),
    stop,
  }
}

export function useDndSession() {
  return {
    active: computed(() => session.value !== null),
    session: readonly(session),
  }
}
