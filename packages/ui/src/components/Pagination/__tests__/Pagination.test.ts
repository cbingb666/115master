// @vitest-environment jsdom

import type { PaginationLabels } from '../Pagination'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import { Pagination } from '../Pagination'

const apps: ReturnType<typeof createApp>[] = []

const labels: PaginationLabels = {
  previousPage: 'Previous page',
  nextPage: 'Next page',
  jumpToPage: 'Jump to page',
  pageSize: 'Items per page',
  pageSizeUnit: 'items',
}

function mount() {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(Pagination, {
      currentPage: 1,
      currentPageSize: 30,
      total: 90,
      showSizeChanger: false,
      labels,
      onCurrentPageChange: () => {},
      onPageSizeChange: () => {},
    }),
  })
  app.mount(host)
  apps.push(app)
  return host
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('pagination', () => {
  it('renders a surface-free layout with one inset selection lens', () => {
    const root = mount().firstElementChild!
    const buttons = [...root.querySelectorAll('button')]
    const current = root.querySelector('[aria-current="page"]')

    expect(root.tagName).toBe('DIV')
    expect(root.classList).toContain('p-1.5')
    expect(root.classList).not.toContain('px-3')
    expect(root.classList).not.toContain('py-1.5')
    expect(root.classList).not.toContain('ui-pill')
    expect(root.classList).not.toContain('ui-glass-floating')
    expect(buttons).toHaveLength(7)
    expect(current?.classList).toContain('ui-glass-inset')
    expect(buttons.filter(button => button !== current).every(button => button.classList.contains('btn-ghost'))).toBe(true)
    expect(root.querySelector('button.ui-glass-surface')).toBeNull()
    expect(root.querySelector('button.ui-glass-floating')).toBeNull()
    expect(root.querySelector('.btn-active')).toBeNull()
  })
})
