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
  it('pairs ascending and descending options in visual rows', () => {
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

    expect(group?.classList).toContain('grid-flow-col')
    expect(group?.classList).toContain('grid-cols-2')
    expect(group?.classList).toContain('grid-rows-5')
    expect(labels).toEqual([
      '创建升序',
      '修改升序',
      '打开升序',
      '名称升序',
      '大小升序',
      '创建降序',
      '修改降序',
      '打开降序',
      '名称降序',
      '大小降序',
    ])
    expect(labels.slice(0, 5).map((label, i) => [label, labels[i + 5]])).toEqual([
      ['创建升序', '创建降序'],
      ['修改升序', '修改降序'],
      ['打开升序', '打开降序'],
      ['名称升序', '名称降序'],
      ['大小升序', '大小降序'],
    ])
  })
})
