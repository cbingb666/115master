// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import Button from '../../../../Button/Button'
import PlayerControlSurface from '../PlayerControlSurface'

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('playerControlSurface', () => {
  it('owns one Float Glass Pill with ghost buttons inside', () => {
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

    const surface = host.querySelector('.pill')
    const button = host.querySelector('button')

    expect(host.querySelectorAll('.app-glass-floating')).toHaveLength(1)
    expect(surface?.classList).toContain('app-glass-floating')
    expect(surface?.classList).toContain('x-player-control-surface')
    expect(button?.classList).toContain('btn-ghost')
    expect(button?.hasAttribute('disabled')).toBe(true)
  })
})
