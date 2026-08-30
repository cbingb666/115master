// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h } from 'vue'

vi.mock('@/icons', async (importOriginal) => {
  const icons = await importOriginal<typeof import('@/icons')>()

  return {
    ...icons,
    Icon: defineComponent({ setup: () => () => h('i') }),
  }
})

const { default: SortOptions } = await import('../SortOptions')

const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

describe('sort options', () => {
  it('uses one compact column and pairs ascending and descending options on wider surfaces', () => {
    const host = document.createElement('div')
    const app = createApp(SortOptions, {
      order: 'user_ptime',
      asc: 1,
      fc_mix: 1,
      onSort: vi.fn(),
    })
    app.mount(host)
    apps.push(app)

    const group = host.querySelector('[role="radiogroup"]')
    const labels = [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
      .map(radio => radio.getAttribute('aria-label'))

    expect(group?.classList).toContain('grid-flow-row!')
    expect(group?.classList).toContain('grid-cols-1')
    expect(group?.classList).toContain('sm:grid-flow-col!')
    expect(group?.classList).toContain('sm:grid-cols-2')
    expect(group?.classList).toContain('sm:grid-rows-5')
    expect(labels).toEqual([
      '最早创建',
      '最早修改',
      '最早打开',
      '名称 A–Z',
      '最小优先',
      '最近创建',
      '最近修改',
      '最近打开',
      '名称 Z–A',
      '最大优先',
    ])
    expect(labels.slice(0, 5).map((label, i) => [label, labels[i + 5]])).toEqual([
      ['最早创建', '最近创建'],
      ['最早修改', '最近修改'],
      ['最早打开', '最近打开'],
      ['名称 A–Z', '名称 Z–A'],
      ['最小优先', '最大优先'],
    ])
  })
})
