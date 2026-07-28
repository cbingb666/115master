// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import Pagination from '../Pagination'

const apps: ReturnType<typeof createApp>[] = []

function mount(surface: 'plain' | 'floating' = 'plain') {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(Pagination, {
      surface,
      currentPage: 1,
      currentPageSize: 30,
      total: 90,
      showSizeChanger: false,
    }),
  })
  app.mount(host)
  apps.push(app)
  return host
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('pagination surface', () => {
  it('keeps the plain surface free of glass', () => {
    const root = mount().firstElementChild!
    const current = root.querySelector('[aria-current="page"]')

    expect(root.classList).toContain('ui-pill')
    expect(root.classList).toContain('ui-pill-md')
    expect(root.classList).not.toContain('ui-glass-floating')
    expect(current?.classList).toContain('btn-soft')
  })

  it('owns one floating glass surface and uses an inset selection lens', () => {
    const root = mount('floating').firstElementChild!
    const buttons = [...root.querySelectorAll('button')]
    const current = root.querySelector('[aria-current="page"]')

    expect(root.classList).toContain('ui-pill')
    expect(root.classList).toContain('ui-glass-floating')
    expect(buttons).toHaveLength(7)
    expect(current?.classList).toContain('btn-glass-inset')
    expect(buttons.filter(button => button !== current).every(button => button.classList.contains('btn-ghost'))).toBe(true)
    expect(root.querySelector('.btn-glass-surface')).toBeNull()
    expect(root.querySelector('.btn-glass-floating')).toBeNull()
    expect(root.querySelector('.btn-active')).toBeNull()
  })
})
