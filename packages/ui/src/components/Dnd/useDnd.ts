import type { ComputedRef, InjectionKey, ShallowRef, VNodeChild } from 'vue'
import { computed, inject, provide, shallowRef } from 'vue'

interface DndTargetRegistration {
  el: () => HTMLElement | undefined
  accept: (payload: unknown) => boolean
  drop: (payload: unknown) => void
}

interface DndSession {
  payload: unknown
  ghost: () => VNodeChild
  pointerType: string
  x: number
  y: number
  target: DndTargetRegistration | null
  offset: DndOffset
}

interface DndSourceOptions {
  payload: () => unknown
  ghost: (payload: unknown) => VNodeChild
  offset: DndOffset
  disabled: (event: PointerEvent) => boolean
}

interface DndContext {
  active: ComputedRef<boolean>
  session: ShallowRef<DndSession | null>
  start: (event: PointerEvent, options: DndSourceOptions) => void
  register: (target: DndTargetRegistration) => () => void
  dispose: () => void
}

export interface DndOffset {
  x: number
  y: number
}

export interface DndSourceBindings {
  onPointerdown: (event: PointerEvent) => void
}

export interface DndTargetBindings {
  ref: (value: unknown) => void
}

const KEY: InjectionKey<DndContext> = Symbol('Dnd')
const THRESHOLD_MOUSE = 6
const THRESHOLD_TOUCH = 10
const EDGE = 48
const SPEED = 12

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

/** 拖拽结束后吞掉源元素上合成的 click；超时未触发则撤除。 */
function swallowClick() {
  const click = (event: Event) => {
    event.preventDefault()
    event.stopPropagation()
    document.removeEventListener('click', click, true)
  }
  document.addEventListener('click', click, true)
  setTimeout(() => document.removeEventListener('click', click, true), 0)
}

function createDnd(): DndContext {
  const session = shallowRef<DndSession | null>(null)
  const targets = new Set<DndTargetRegistration>()
  const active = computed(() => session.value !== null)
  let scroller: HTMLElement | Window | null = null
  let raf = 0
  let pending: (() => void) | null = null

  function hit(x: number, y: number, payload: unknown) {
    for (const target of targets) {
      const el = target.el()
      if (!el?.isConnected)
        continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom && target.accept(payload))
        return target
    }
    return null
  }

  function prevent(event: Event) {
    event.preventDefault()
  }

  function move(event: PointerEvent) {
    const current = session.value
    if (!current)
      return
    session.value = {
      ...current,
      x: event.clientX,
      y: event.clientY,
      target: hit(event.clientX, event.clientY, current.payload),
    }
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

  function drop() {
    const current = session.value
    clearDrag()
    session.value = null
    swallowClick()
    if (current?.target)
      current.target.drop(current.payload)
  }

  function cancel() {
    clearDrag()
    session.value = null
  }

  function scroll() {
    const current = session.value
    if (!current)
      return
    const top = current.y < EDGE
    const bottom = current.y > window.innerHeight - EDGE
    if (top || bottom) {
      const ratio = top ? 1 - current.y / EDGE : 1 - (window.innerHeight - current.y) / EDGE
      const dy = Math.ceil(SPEED * ratio) * (top ? -1 : 1)
      if (scroller === window)
        window.scrollBy(0, dy)
      else
        scroller?.scrollBy({ top: dy })
      session.value = {
        ...current,
        target: hit(current.x, current.y, current.payload),
      }
    }
    raf = requestAnimationFrame(scroll)
  }

  function clearPending() {
    pending?.()
    pending = null
  }

  function start(event: PointerEvent, options: DndSourceOptions) {
    if (event.pointerType === 'mouse' && event.button !== 0)
      return
    if (options.disabled(event))
      return

    clearPending()
    const x = event.clientX
    const y = event.clientY
    const threshold = event.pointerType === 'touch' ? THRESHOLD_TOUCH : THRESHOLD_MOUSE

    const activate = (moveEvent: PointerEvent) => {
      if (Math.hypot(moveEvent.clientX - x, moveEvent.clientY - y) < threshold)
        return
      clearPending()
      const payload = options.payload()
      if (Array.isArray(payload) && payload.length === 0)
        return
      session.value = {
        payload,
        ghost: () => options.ghost(payload),
        pointerType: moveEvent.pointerType,
        x: moveEvent.clientX,
        y: moveEvent.clientY,
        target: hit(moveEvent.clientX, moveEvent.clientY, payload),
        offset: options.offset,
      }
      scroller = nearestScroller(moveEvent.target as HTMLElement)
      document.documentElement.style.userSelect = 'none'
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', drop)
      document.addEventListener('pointercancel', cancel)
      document.addEventListener('touchmove', prevent, { passive: false })
      raf = requestAnimationFrame(scroll)
    }

    const stop = () => {
      document.removeEventListener('pointermove', activate)
      document.removeEventListener('pointerup', clearPending)
      document.removeEventListener('pointercancel', clearPending)
    }
    pending = stop
    document.addEventListener('pointermove', activate)
    document.addEventListener('pointerup', clearPending)
    document.addEventListener('pointercancel', clearPending)
  }

  function register(target: DndTargetRegistration) {
    targets.add(target)
    return () => {
      targets.delete(target)
      if (session.value?.target === target)
        session.value = { ...session.value, target: null }
    }
  }

  function dispose() {
    clearPending()
    clearDrag()
    session.value = null
    targets.clear()
  }

  return { active, session, start, register, dispose }
}

export function provideDnd() {
  const dnd = createDnd()
  provide(KEY, dnd)
  return dnd
}

export function useDnd() {
  const dnd = inject(KEY)
  if (!dnd)
    throw new Error('DnD components must be rendered inside DndRoot')
  return dnd
}
