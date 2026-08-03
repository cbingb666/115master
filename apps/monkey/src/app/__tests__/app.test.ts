// @vitest-environment jsdom

import { afterEach, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

vi.mock('vite-plugin-monkey/dist/client', () => ({
  GM_info: {
    script: {
      name: '115Master-dev-test',
    },
  },
}))

vi.mock('@115master/ui', async () => {
  const { defineComponent, h } = await import('vue')
  const Host = defineComponent({
    setup: (_, { slots }) => () => slots.default?.(),
  })

  return {
    DialogHost: Host,
    ModalHost: Host,
    OverlayHost: Host,
    Watermark: defineComponent({
      props: {
        content: {
          type: String,
          required: true,
        },
        opacity: {
          type: Number,
          default: 0.18,
        },
      },
      setup: (props, { slots }) => () => h(
        'div',
        {
          'data-watermark-content': props.content,
          'data-watermark-opacity': props.opacity,
        },
        slots.default?.(),
      ),
    }),
  }
})

vi.mock('@/app/dialog', () => ({ appDialog: {} }))
vi.mock('@/components', async () => {
  const { defineComponent } = await import('vue')
  return {
    GlobalSearchModal: defineComponent({ setup: () => () => null }),
    ToastContainer: defineComponent({
      setup: (_, { slots }) => () => slots.default?.(),
    }),
    useSponsorBoot: () => {},
  }
})
vi.mock('@/components/Preferences', async () => {
  const { defineComponent } = await import('vue')
  return {
    PreferencesDialog: defineComponent({ setup: () => () => null }),
  }
})
vi.mock('@/components/Dnd', async () => {
  const { defineComponent } = await import('vue')
  return {
    DndRoot: defineComponent({
      setup: (_, { slots }) => () => slots.default?.(),
    }),
  }
})
vi.mock('@/utils/logger', () => ({ appLogger: { error: vi.fn() } }))
vi.mock('vue-router', async () => {
  const { defineComponent } = await import('vue')
  return {
    RouterView: defineComponent({ setup: () => () => null }),
  }
})

const { default: App } = await import('../app')
const apps: ReturnType<typeof createApp>[] = []

afterEach(() => {
  apps.splice(0).forEach(app => app.unmount())
})

it('shows the userscript name as the MASTER development watermark', () => {
  const host = document.createElement('div')
  const app = createApp(App)
  app.mount(host)
  apps.push(app)

  const watermark = host.querySelector<HTMLElement>('[data-watermark-content]')

  expect(import.meta.env.DEV).toBe(true)
  expect(watermark?.dataset.watermarkContent).toBe('115Master-dev-test')
  expect(watermark?.dataset.watermarkOpacity).toBe('0.09')
  expect(watermark?.classList).toContain('fixed')
  expect(watermark?.classList).toContain('inset-0')
  expect(watermark?.classList).toContain('pointer-events-none')
  expect(watermark?.classList).toContain('ui-z-watermark')
})
