// @vitest-environment jsdom

import type { MaybeElement } from '@vueuse/core'
import { unrefElement } from '@vueuse/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, h, nextTick, shallowRef } from 'vue'
import Button from '../Button'

const apps: ReturnType<typeof createApp>[] = []

function mount(props: Record<string, unknown> = {}) {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(Button, props, () => '操作'),
  })
  app.mount(host)
  apps.push(app)
  return host.querySelector('button')!
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('button', () => {
  it('uses safe native defaults and forwards attributes', () => {
    const click = vi.fn()
    const button = mount({
      class: 'w-full',
      title: '保存',
      onClick: click,
    })

    button.click()

    expect(button.type).toBe('button')
    expect(button.title).toBe('保存')
    expect([...button.classList]).toEqual(expect.arrayContaining(['btn', 'btn-md', 'w-full']))
    expect(click).toHaveBeenCalledOnce()
  })

  it('maps semantic props to standard daisyUI classes', () => {
    const button = mount({
      color: 'error',
      variant: 'soft',
      size: 'sm',
      shape: 'circle',
      active: true,
      block: true,
    })

    expect([...button.classList]).toEqual(expect.arrayContaining([
      'btn-error',
      'btn-soft',
      'btn-sm',
      'btn-circle',
      'btn-active',
      'btn-block',
    ]))
  })

  it('exposes each glass scene as an explicit variant', () => {
    expect(mount({ variant: 'glass-surface' }).classList).toContain('btn-glass-surface')
    expect(mount({ variant: 'glass-inset' }).classList).toContain('btn-glass-inset')
    expect(mount({ variant: 'glass-floating' }).classList).toContain('btn-glass-floating')
    expect(mount({ variant: 'glass-overlay' }).classList).toContain('btn-glass-overlay')
  })

  it('disables interaction and exposes busy state while loading', () => {
    const button = mount({ loading: true })

    expect(button.disabled).toBe(true)
    expect(button.getAttribute('aria-busy')).toBe('true')
    expect(button.querySelector('.loading-spinner')).not.toBeNull()
  })

  it('uses the native disabled state and blocks click events', () => {
    const click = vi.fn()
    const button = mount({
      disabled: true,
      onClick: click,
    })

    button.click()

    expect(button.disabled).toBe(true)
    expect(click).not.toHaveBeenCalled()
  })

  it('unwraps to its native element for popup anchors', async () => {
    const host = document.createElement('div')
    const button = shallowRef<MaybeElement>()
    const app = createApp({
      setup: () => () => h(Button, { ref: button }, () => '打开'),
    })
    app.mount(host)
    apps.push(app)
    await nextTick()

    expect(unrefElement(button)).toBe(host.querySelector('button'))
  })
})
