// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { I } from '@/icons'
import { actionIcon } from '@/utils/action'
import ActionBar from '../ActionBar'

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('actionBar', () => {
  it('renders a surface-free action layout', () => {
    const host = document.createElement('div')
    const app = createApp({
      setup: () => () => h(ActionBar, { groups: [] }),
    })
    app.mount(host)
    apps.push(app)

    const root = host.firstElementChild

    expect(root?.tagName).toBe('DIV')
    expect(root?.classList).not.toContain('ui-pill')
    expect(root?.classList).not.toContain('ui-glass-floating')
    expect(host.querySelector('.ui-pill')).toBeNull()
  })

  it('uses the shared Tooltip for action labels', async () => {
    const host = document.createElement('div')
    const app = createApp({
      setup: () => () => h(ActionBar, {
        groups: [[{
          id: 'download',
          label: '下载',
          leading: actionIcon(I.DOWNLOAD),
          onSelect: () => {},
        }]],
      }),
    })
    app.mount(host)
    apps.push(app)

    const button = host.querySelector('button')
    button?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await nextTick()

    const tooltip = document.body.querySelector('[data-ui-tooltip]')

    expect(button).not.toBeNull()
    expect(tooltip).not.toBeNull()
    expect(button?.classList.contains('tooltip')).toBe(false)
    expect(button?.hasAttribute('data-tip')).toBe(false)
    expect(tooltip?.textContent).toContain('下载')
    expect(button?.getAttribute('aria-describedby')).toBe(tooltip?.id)
  })
})
