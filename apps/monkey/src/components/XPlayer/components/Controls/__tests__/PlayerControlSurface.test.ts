// @vitest-environment jsdom

import { Button } from '@115master/ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import PlayerControlSurface from '../PlayerControlSurface'

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('playerControlSurface', () => {
  it('owns one Panel Glass Pill with ghost buttons inside', () => {
    const host = document.createElement('div')
    const app = createApp({
      setup: () => () => h(
        PlayerControlSurface,
        null,
        {
          default: () => h(Button, {
            variant: 'ghost',
            shape: 'circle',
            disabled: true,
          }, () => '音轨'),
        },
      ),
    })
    app.mount(host)
    apps.push(app)

    const surface = host.querySelector('.ui-pill')
    const button = host.querySelector('button')

    expect(host.querySelectorAll('.ui-glass-panel')).toHaveLength(1)
    expect(surface?.classList).toContain('ui-glass-panel')
    expect(surface?.classList).toContain('x-player-control-surface')
    expect(button?.classList).toContain('btn-ghost')
    expect(button?.hasAttribute('disabled')).toBe(true)
  })
})
