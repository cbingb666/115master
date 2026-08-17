// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import Controls from '../index.vue'

const apps: ReturnType<typeof createApp>[] = []
const context = vi.hoisted(() => ({
  progressBar: {
    isLongPressDragging: { value: true },
  },
}))

vi.mock('@/components/XPlayer/hooks/usePlayerProvide', () => ({
  usePlayerContext: () => context,
}))

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('controls', () => {
  it('uses a fixed dark mask while long-press dragging the progress bar', () => {
    const host = document.createElement('div')
    const app = createApp(Controls)
    app.mount(host)
    apps.push(app)

    const mask = host.firstElementChild

    expect(mask?.getAttribute('data-mask')).toBe('true')
    expect(mask?.classList).toContain('data-[mask="true"]:bg-black/50')
    expect(Array.from(mask?.classList ?? []).some(name => name.includes('bg-base-'))).toBe(false)
  })
})
