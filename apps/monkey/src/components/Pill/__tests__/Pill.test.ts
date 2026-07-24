// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h } from 'vue'
import Pill from '../Pill'

const apps: ReturnType<typeof createApp>[] = []

function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(Pill, props, () => '内容'),
  })
  app.mount(host)
  apps.push(app)
  return host.firstElementChild as HTMLElement
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('pill', () => {
  it('is a plain medium container by default', () => {
    const pill = mount()

    expect(pill.classList).toContain('pill')
    expect(pill.classList).toContain('pill-md')
    expect(pill.className).not.toContain('app-glass-')
  })

  it.each([
    ['glass-surface', 'app-glass-surface'],
    ['glass-floating', 'app-glass-floating'],
    ['glass-overlay', 'app-glass-overlay'],
  ] as const)('maps %s to its shared container material', (variant, className) => {
    const pill = mount({ variant })

    expect(pill.classList).toContain(className)
  })

  it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
    'maps size %s to an explicit geometry class',
    (size) => {
      const pill = mount({ size })

      expect(pill.classList).toContain(`pill-${size}`)
    },
  )

  it('renders links and forwards native attributes', () => {
    const onClick = vi.fn()
    const pill = mount({
      'as': 'a',
      'variant': 'glass-surface',
      'href': '#/drive',
      'onClick': onClick,
      'aria-current': 'page',
      'data-testid': 'path',
    })

    pill.click()

    expect(pill.tagName).toBe('A')
    expect(pill.getAttribute('href')).toBe('#/drive')
    expect(pill.getAttribute('aria-current')).toBe('page')
    expect(pill.dataset.testid).toBe('path')
    expect(pill.classList).not.toContain('app-glass-floating')
    expect(pill.classList).toContain('app-glass-surface')
    expect(onClick).toHaveBeenCalledOnce()
  })
})
