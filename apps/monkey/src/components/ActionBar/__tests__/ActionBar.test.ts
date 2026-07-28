// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import ActionBar from '../ActionBar'

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('actionBar', () => {
  it('uses the shared floating Pill material', () => {
    const host = document.createElement('div')
    const app = createApp({
      setup: () => () => h(ActionBar, { groups: [] }),
    })
    app.mount(host)
    apps.push(app)

    const surface = host.querySelector('.ui-pill')

    expect(surface?.classList).toContain('ui-glass-floating')
    expect(surface?.classList).toContain('ui-pill-xl')
  })
})
