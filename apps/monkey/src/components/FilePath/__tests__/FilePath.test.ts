// @vitest-environment jsdom

import type { Share } from '@115master/drive115'
import { DndRoot } from '@115master/ui'
import { afterEach, describe, expect, it } from 'vitest'
import { createApp, h } from 'vue'
import FilePath from '../FilePath'

const apps: ReturnType<typeof createApp>[] = []
const path: Share.Entity.PathItem[] = [
  { cid: '0', name: '根目录', aid: '1', pid: '0', p_cid: '0', isp: '0', iss: '0', fv: '0', fvs: '0' },
  { cid: '1', name: '电影', aid: '1', pid: '0', p_cid: '0', isp: '0', iss: '0', fv: '0', fvs: '0' },
]

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

function mount(floating?: boolean, size?: 'sm' | 'md') {
  const host = document.createElement('div')
  const app = createApp({
    setup: () => () => h(DndRoot, null, {
      default: () => h(FilePath, {
        floating,
        path,
        pathSelect: true,
        size,
      }),
    }),
  })
  app.mount(host)
  apps.push(app)
  return host
}

describe('filePath', () => {
  it('uses floating glass by default', () => {
    const host = mount()

    expect(host.querySelectorAll('.ui-glass-floating')).toHaveLength(2)
    expect(host.querySelector('.breadcrumbs')?.classList).toContain('p-3')
  })

  it('uses soft styling when floating is disabled', () => {
    const host = mount(false)

    expect(host.querySelector('.ui-glass-floating')).toBeNull()
    expect(host.querySelectorAll('.ui-pill-soft')).toHaveLength(2)
    expect(host.querySelector('.breadcrumbs')?.classList).toContain('py-0')
  })

  it('supports small path items', () => {
    const host = mount(false, 'sm')

    expect(host.querySelectorAll('.ui-pill-sm')).toHaveLength(2)
    expect(host.querySelectorAll('.ui-pill-sm.text-sm')).toHaveLength(2)
    expect(host.querySelectorAll('.ui-pill-sm.min-h-7.px-2\\.5')).toHaveLength(2)
  })
})
