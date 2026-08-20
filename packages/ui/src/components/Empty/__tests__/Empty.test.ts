// @vitest-environment jsdom

import type { VNodeChild } from 'vue'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import { Empty } from '../Empty'

const apps: ReturnType<typeof createApp>[] = []

function mount(
  props: {
    description: string
    image?: string
    showImage?: boolean
    class?: string
  },
  slots?: {
    default?: () => VNodeChild
    icon?: () => VNodeChild
  },
) {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(Empty, props, slots),
  })
  app.mount(host)
  apps.push(app)
  return host
}

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('empty', () => {
  it('renders caller-owned content and forwards root attributes', () => {
    const host = mount(
      { description: 'No files', class: 'min-h-40' },
      { default: () => h('button', 'Upload') },
    )
    const root = host.firstElementChild

    expect(root?.hasAttribute('data-ui-empty')).toBe(true)
    expect(root?.classList).toContain('min-h-40')
    expect(root?.querySelector('p')?.textContent).toBe('No files')
    expect(root?.querySelector('button')?.textContent).toBe('Upload')
  })

  it('renders custom icons as decorative content', () => {
    const host = mount(
      { description: 'No matches' },
      { icon: () => h('svg', { 'data-custom-icon': '' }) },
    )
    const icon = host.querySelector('[data-custom-icon]')

    expect(icon).not.toBeNull()
    expect(icon?.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('gives images decorative semantics and can hide the visual region', () => {
    const image = mount({ description: 'No uploads', image: 'fixture.svg' })
      .querySelector('img')
    const hidden = mount({ description: 'Nothing else', showImage: false })

    expect(image?.getAttribute('alt')).toBe('')
    expect(image?.closest('[aria-hidden="true"]')).not.toBeNull()
    expect(hidden.querySelector('[aria-hidden="true"]')).toBeNull()
  })
})
