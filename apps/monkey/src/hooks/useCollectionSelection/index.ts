import type { ComputedRef, ShallowRef } from 'vue'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import { computed, onScopeDispose, shallowRef, watch, watchEffect } from 'vue'

const ATTRIBUTE = 'data-selection-key'
const EDGE = 80
const SPEED = 12
const DISTANCE = 10
const LONG_PRESS = 200
const INTERACTIVE = 'input, textarea, select, button, label, [contenteditable]'

interface Point {
  x: number
  y: number
}

export interface CollectionSelectionAdapter<T> {
  has: (item: T) => boolean
  set: (item: T, selected: boolean) => void
  clear: () => void
  size: () => number
}

export interface CollectionSelectionOptions<T> {
  items: () => readonly T[]
  key: (item: T) => string
  selection: CollectionSelectionAdapter<T>
  container: () => HTMLElement | undefined
  onActivate: (item: T) => void
}

export interface CollectionSelectionMenu<T> extends Point {
  item: T
}

export interface CollectionSelectionBind<T> {
  active: ComputedRef<boolean>
  menu: ShallowRef<CollectionSelectionMenu<T> | null>
  itemProps: (item: T) => {
    'data-selection-key': string
    'onClick': (event: MouseEvent) => void
    'onContextmenu': (event: MouseEvent) => void
    'onPointerdown': (event: PointerEvent) => void
  }
  set: (item: T, selected: boolean) => void
  clear: () => void
  selectAll: () => void
  invert: () => void
  closeMenu: () => void
}

function element(target: EventTarget | null) {
  const value = target as Element | null
  if (!value || typeof value.matches !== 'function' || typeof value.closest !== 'function')
    return undefined
  return value
}

function editable(target: EventTarget | null) {
  const value = element(target)
  return Boolean(value?.matches(INTERACTIVE) || value?.closest(INTERACTIVE))
}

function scroller(container: HTMLElement): HTMLElement | Window {
  let current: HTMLElement | null = container
  while (current) {
    const style = getComputedStyle(current)
    if (/auto|scroll/.test(style.overflowY) && current.scrollHeight > current.clientHeight)
      return current
    current = current.parentElement
  }
  return window
}

/**
 * Collection selection interaction module.
 *
 * Selection state stays with the caller through one adapter; every pointer,
 * keyboard and marquee path writes through that same seam.
 */
export function useCollectionSelection<T>(options: CollectionSelectionOptions<T>): CollectionSelectionBind<T> {
  const active = computed(() => options.selection.size() > 0)
  const menu = shallowRef<CollectionSelectionMenu<T> | null>(null)
  const selecting = shallowRef(false)
  const start = shallowRef<Point>({ x: 0, y: 0 })
  const end = shallowRef<Point>({ x: 0, y: 0 })
  const box = shallowRef<HTMLElement>()
  const host = shallowRef<HTMLElement>()
  const scroll = shallowRef<HTMLElement | Window>()
  const pointer: Point = { x: 0, y: 0 }
  const hits = new Set<string>()
  const base = new Set<string>()
  let anchor: string | undefined
  let pressed = false
  let additive = false
  let frame = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let press: { item: T, point: Point, tolerance: number } | undefined
  let suppressed: { key: string, until: number } | undefined
  let swallow: ((event: MouseEvent) => void) | undefined
  let swallowTimer: ReturnType<typeof setTimeout> | undefined
  let down: Point = { x: 0, y: 0 }
  let userSelect = ''

  function set(value: T, selected: boolean) {
    options.selection.set(value, selected)
    if (selected)
      anchor = options.key(value)
  }

  function closeMenu() {
    menu.value = null
  }

  function clear() {
    options.selection.clear()
    anchor = undefined
    closeMenu()
  }

  function selectAll() {
    options.selection.clear()
    options.items().forEach(value => options.selection.set(value, true))
  }

  function invert() {
    options.items().forEach(value => options.selection.set(value, !options.selection.has(value)))
  }

  function click(value: T, event: MouseEvent) {
    if (editable(event.target))
      return
    event.preventDefault()
    const key = options.key(value)
    if (suppressed?.key === key && performance.now() <= suppressed.until) {
      suppressed = undefined
      return
    }
    suppressed = undefined

    const items = options.items()
    const index = items.findIndex(candidate => options.key(candidate) === key)
    if (index < 0)
      return

    if (event.shiftKey) {
      const origin = anchor === undefined
        ? -1
        : items.findIndex(candidate => options.key(candidate) === anchor)
      if (origin < 0) {
        set(value, true)
        return
      }
      const from = Math.min(origin, index)
      const to = Math.max(origin, index)
      items.slice(from, to + 1).forEach(candidate => options.selection.set(candidate, true))
      return
    }

    if (event.metaKey || event.ctrlKey) {
      set(value, !options.selection.has(value))
      return
    }

    if (active.value) {
      set(value, !options.selection.has(value))
      return
    }

    options.onActivate(value)
  }

  function contextmenu(value: T, event: MouseEvent) {
    event.preventDefault()
    const key = options.key(value)
    if (suppressed?.key === key && performance.now() <= suppressed.until)
      return
    if (editable(event.target))
      return

    if (!options.selection.has(value)) {
      if (options.selection.size() <= 1)
        options.selection.clear()
      set(value, true)
    }
    else {
      anchor = key
    }
    menu.value = { item: value, x: event.clientX, y: event.clientY }
  }

  function clearPress() {
    if (timer !== undefined)
      clearTimeout(timer)
    timer = undefined
    press = undefined
  }

  function pointerdown(value: T, event: PointerEvent) {
    if ((event.pointerType === 'mouse' && event.button !== 0) || active.value || editable(event.target))
      return
    clearPress()
    press = {
      item: value,
      point: { x: event.clientX, y: event.clientY },
      tolerance: event.pointerType === 'mouse' ? 6 : 10,
    }
    timer = setTimeout(() => {
      if (!press || active.value)
        return
      const key = options.key(press.item)
      if (!options.selection.has(press.item))
        set(press.item, true)
      suppressed = { key, until: performance.now() + 1000 }
      clearPress()
    }, LONG_PRESS)
  }

  function point(x: number, y: number): Point {
    const container = host.value
    if (!container)
      return { x, y }
    const bounds = container.getBoundingClientRect()
    return {
      x: x - bounds.left + container.scrollLeft,
      y: y - bounds.top + container.scrollTop,
    }
  }

  function rectangle() {
    return {
      left: Math.min(start.value.x, end.value.x),
      top: Math.min(start.value.y, end.value.y),
      width: Math.abs(end.value.x - start.value.x),
      height: Math.abs(end.value.y - start.value.y),
    }
  }

  function intersects(node: HTMLElement) {
    const container = host.value
    if (!container)
      return false
    const bounds = container.getBoundingClientRect()
    const rect = node.getBoundingClientRect()
    const selection = rectangle()
    const left = rect.left - bounds.left + container.scrollLeft
    const top = rect.top - bounds.top + container.scrollTop
    const right = rect.right - bounds.left + container.scrollLeft
    const bottom = rect.bottom - bounds.top + container.scrollTop
    return !(
      selection.left > right
      || selection.left + selection.width < left
      || selection.top > bottom
      || selection.top + selection.height < top
    )
  }

  function updateBox() {
    if (!box.value)
      return
    const rect = rectangle()
    box.value.style.display = selecting.value ? 'block' : 'none'
    box.value.style.left = `${rect.left}px`
    box.value.style.top = `${rect.top}px`
    box.value.style.width = `${rect.width}px`
    box.value.style.height = `${rect.height}px`
  }

  /** DOM supplies only mounted item geometry and keys; state changes go through the adapter. */
  function updateSelection() {
    const container = host.value
    if (!container || !selecting.value)
      return
    const values = new Map(options.items().map(value => [options.key(value), value]))
    const mounted = new Set<string>()
    const current = new Set<string>()

    container.querySelectorAll<HTMLElement>(`[${ATTRIBUTE}]`).forEach((node) => {
      const key = node.getAttribute(ATTRIBUTE)
      if (!key || !values.has(key))
        return
      mounted.add(key)
      if (intersects(node))
        current.add(key)
    })

    hits.forEach((key) => {
      if (!mounted.has(key) || current.has(key) || base.has(key))
        return
      const value = values.get(key)
      if (value)
        options.selection.set(value, false)
    })
    current.forEach((key) => {
      const value = values.get(key)
      if (value && !options.selection.has(value))
        options.selection.set(value, true)
    })

    const pending = [...hits].filter(key => !mounted.has(key))
    hits.clear()
    pending.forEach(key => hits.add(key))
    current.forEach(key => hits.add(key))
  }

  function update() {
    updateBox()
    updateSelection()
  }

  function beginSelection() {
    selecting.value = true
    hits.clear()
    base.clear()
    if (additive) {
      options.items()
        .filter(options.selection.has)
        .forEach(value => base.add(options.key(value)))
    }
    else {
      options.selection.clear()
    }
    if (host.value) {
      userSelect = host.value.style.userSelect
      host.value.style.userSelect = 'none'
    }
    update()
    frame = requestAnimationFrame(autoScroll)
  }

  function clearSwallow() {
    if (swallow)
      document.removeEventListener('click', swallow, true)
    if (swallowTimer !== undefined)
      clearTimeout(swallowTimer)
    swallow = undefined
    swallowTimer = undefined
  }

  function swallowClick() {
    clearSwallow()
    swallow = (event) => {
      event.preventDefault()
      event.stopPropagation()
      clearSwallow()
    }
    document.addEventListener('click', swallow, true)
    swallowTimer = setTimeout(clearSwallow, 0)
  }

  function endSelection() {
    pressed = false
    if (!selecting.value)
      return
    selecting.value = false
    cancelAnimationFrame(frame)
    frame = 0
    if (host.value)
      host.value.style.userSelect = userSelect
    updateBox()
    swallowClick()
  }

  function autoScroll() {
    if (!selecting.value)
      return
    const target = scroll.value
    if (target) {
      const root = target === window
      const bounds = root ? null : (target as HTMLElement).getBoundingClientRect()
      const top = root ? 0 : Math.max(0, bounds!.top)
      const bottom = root ? window.innerHeight : Math.min(window.innerHeight, bounds!.bottom)
      const above = pointer.y < top + EDGE
      const below = pointer.y > bottom - EDGE
      if (bottom > top && (above || below)) {
        const ratio = above
          ? (top + EDGE - pointer.y) / EDGE
          : (pointer.y - bottom + EDGE) / EDGE
        const distance = Math.ceil(SPEED * Math.min(1, Math.max(0, ratio))) * (above ? -1 : 1)
        if (root)
          window.scrollBy(0, distance)
        else
          (target as HTMLElement).scrollBy({ behavior: 'auto', top: distance })
        end.value = point(pointer.x, pointer.y)
        update()
      }
    }
    frame = requestAnimationFrame(autoScroll)
  }

  function mousedown(event: MouseEvent) {
    if (event.button !== 0 || editable(event.target))
      return
    pointer.x = event.clientX
    pointer.y = event.clientY
    pressed = true
    additive = event.shiftKey || event.metaKey || event.ctrlKey
    start.value = point(pointer.x, pointer.y)
    end.value = start.value
  }

  const mousemove = useThrottleFn((event: MouseEvent) => {
    if (!pressed)
      return
    pointer.x = event.clientX
    pointer.y = event.clientY
    end.value = point(pointer.x, pointer.y)
    if (
      !selecting.value
      && Math.abs(start.value.x - end.value.x) < DISTANCE
      && Math.abs(start.value.y - end.value.y) < DISTANCE
    ) {
      return
    }
    if (!selecting.value)
      beginSelection()
    update()
  }, 1000 / 120)

  function pointermove(event: PointerEvent) {
    if (!press)
      return
    if (Math.hypot(event.clientX - press.point.x, event.clientY - press.point.y) >= press.tolerance)
      clearPress()
  }

  function containerPointerdown(event: PointerEvent) {
    down = { x: event.clientX, y: event.clientY }
  }

  function containerPointerup(event: PointerEvent) {
    if (!active.value || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5)
      return
    const target = element(event.target)
    if (!target || target.closest(`[${ATTRIBUTE}]`) || editable(target))
      return
    clear()
  }

  function keydown(event: KeyboardEvent) {
    if (event.defaultPrevented || !options.container()?.isConnected)
      return
    if (event.key === 'Escape' && active.value) {
      event.preventDefault()
      clear()
      return
    }
    if (event.key.toLowerCase() !== 'a' || (!event.metaKey && !event.ctrlKey) || editable(event.target))
      return
    event.preventDefault()
    selectAll()
  }

  function itemProps(value: T) {
    return {
      [ATTRIBUTE]: options.key(value),
      onClick: (event: MouseEvent) => click(value, event),
      onContextmenu: (event: MouseEvent) => contextmenu(value, event),
      onPointerdown: (event: PointerEvent) => pointerdown(value, event),
    } as {
      'data-selection-key': string
      'onClick': (event: MouseEvent) => void
      'onContextmenu': (event: MouseEvent) => void
      'onPointerdown': (event: PointerEvent) => void
    }
  }

  watch(() => options.selection.size(), (size) => {
    if (size === 0)
      anchor = undefined
  })
  watch(() => options.items().map(options.key), (keys) => {
    if (anchor !== undefined && !keys.includes(anchor))
      anchor = undefined
    if (menu.value && !keys.includes(options.key(menu.value.item)))
      closeMenu()
  })

  watchEffect(() => {
    const container = options.container()
    if (!container)
      return
    host.value = container
    scroll.value = scroller(container)
    if (!box.value) {
      box.value = document.createElement('div')
      box.value.className = 'collection-selection-box'
      box.value.style.cssText = `
        position: absolute;
        border: 2px solid var(--color-primary);
        background-color: color-mix(in oklab, var(--color-primary) 10%, transparent);
        pointer-events: none;
        z-index: var(--ui-z-raised);
        display: none;
      `
    }
    if (!container.contains(box.value))
      container.appendChild(box.value)
  })

  useEventListener(options.container, 'mousedown', mousedown)
  useEventListener(options.container, 'mousemove', mousemove)
  useEventListener(options.container, 'pointerdown', containerPointerdown)
  useEventListener(options.container, 'pointerup', containerPointerup)
  useEventListener(document, 'mouseup', endSelection)
  useEventListener(document, 'pointermove', pointermove)
  useEventListener(document, 'pointerup', clearPress)
  useEventListener(document, 'pointercancel', clearPress)
  useEventListener(document, 'keydown', keydown)

  onScopeDispose(() => {
    clearPress()
    clearSwallow()
    cancelAnimationFrame(frame)
    if (host.value)
      host.value.style.userSelect = userSelect
    box.value?.remove()
  })

  return { active, menu, itemProps, set, clear, selectAll, invert, closeMenu }
}
