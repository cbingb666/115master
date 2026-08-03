import type {
  WatermarkContent,
  WatermarkGap,
  WatermarkOffset,
} from '@115master/ui'
import { Watermark } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const contents = [
  { label: 'Single line', value: 'Sample copy' },
  { label: 'Line break', value: 'Sample copy\nReviewer 04' },
  { label: 'Line array', value: ['For review', 'Recipient 04'] },
] as const satisfies readonly { label: string, value: WatermarkContent }[]

const tiles = [
  { label: 'Default spacing', gap: [96, 72], offset: [0, 0] },
  { label: 'Compact spacing', gap: [36, 28], offset: [0, 0] },
  { label: 'Shifted origin', gap: [96, 72], offset: [40, 28] },
] as const satisfies readonly {
  label: string
  gap: WatermarkGap
  offset: WatermarkOffset
}[]

const meta = preview.meta({
  title: 'UI/Watermark',
  component: Watermark,
  args: {
    content: 'Sample copy',
    color: '#64748b',
    opacity: 0.18,
    fontSize: 16,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 500,
    rotate: -22,
    gap: [96, 72],
    offset: [0, 0],
  },
  argTypes: {
    content: { control: 'object' },
    color: { control: 'color' },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    fontSize: { control: { type: 'range', min: 8, max: 48, step: 1 } },
    fontFamily: { control: 'text' },
    fontWeight: { control: 'text' },
    rotate: { control: { type: 'range', min: -90, max: 90, step: 1 } },
    gap: { control: 'object' },
    offset: { control: 'object' },
  },
  render: args => ({
    components: { Watermark },
    setup: () => ({ args }),
    template: `
      <div class="p-6">
        <Watermark
          v-bind="args"
          class="mx-auto max-w-3xl overflow-hidden rounded-box border border-base-300 bg-base-100"
        >
          <article class="grid min-h-80 content-center gap-3 p-8">
            <p class="text-sm font-semibold text-primary">SAMPLE CONTENT</p>
            <h1 class="text-3xl font-bold">Watermark preview</h1>
            <p class="max-w-lg text-base-content/70">
              Use Controls to adjust the decorative text while the underlying content remains readable.
            </p>
          </article>
        </Watermark>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Watermark 在内容区域上方重复铺陈装饰性文本，用于降低副本被随意传播的意愿；它不拦截内容交互、不进入无障碍树，也不是权限或数据保护边界。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
  args: {
    content: 'Sample copy',
  },
})

export const Content = meta.story({
  name: '内容格式',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Watermark },
    setup: () => ({ contents }),
    template: `
      <main aria-label="Watermark content formats" class="grid gap-5 p-6 lg:grid-cols-3">
        <section v-for="item in contents" :key="item.label" class="grid gap-2">
          <h2 class="text-sm font-semibold">{{ item.label }}</h2>
          <Watermark
            :content="item.value"
            class="overflow-hidden rounded-box border border-base-300 bg-base-100"
          >
            <div class="grid min-h-64 place-content-center p-6 text-center text-base-content/70">
              Readable content beneath decoration
            </div>
          </Watermark>
        </section>
      </main>
    `,
  }),
})

export const Tiling = meta.story({
  name: '铺陈布局',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Watermark },
    setup: () => ({ tiles }),
    template: `
      <main aria-label="Watermark tiling" class="grid gap-5 p-6 lg:grid-cols-3">
        <section v-for="tile in tiles" :key="tile.label" class="grid gap-2">
          <h2 class="text-sm font-semibold">{{ tile.label }}</h2>
          <Watermark
            content="Sample copy"
            :gap="tile.gap"
            :offset="tile.offset"
            class="overflow-hidden rounded-box border border-base-300 bg-base-100"
          >
            <div class="min-h-64 p-6" />
          </Watermark>
        </section>
      </main>
    `,
  }),
})

export const Behavior = meta.story({
  name: '装饰与内容交互',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Watermark },
    setup() {
      const actions = ref(0)
      const act = () => actions.value += 1

      return { actions, act }
    },
    template: `
      <div class="p-6">
        <Watermark
          content="Sample copy"
          class="mx-auto max-w-3xl overflow-hidden rounded-box border border-base-300 bg-base-100"
        >
          <section aria-label="Interactive watermarked content" class="grid min-h-80 place-content-center gap-4 p-8 text-center">
            <p class="text-base-content/70">The decoration stays inert above this content.</p>
            <div class="flex items-center justify-center gap-3">
              <button type="button" class="btn btn-primary" @click="act">Run action</button>
              <span>
                Actions:
                <output aria-live="polite" data-ui-watermark-actions>{{ actions }}</output>
              </span>
            </div>
          </section>
        </Watermark>
      </div>
    `,
  }),
})

Behavior.test('keeps decoration inert above interactive content', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const mark = canvasElement.querySelector<HTMLElement>('[data-ui-watermark-mark]')
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-watermark-actions]')

  if (!mark || !actions)
    throw new Error('Watermark behavior story did not render its decoration and outcome')

  await expect(mark).toHaveAttribute('aria-hidden', 'true')
  await expect(getComputedStyle(mark).backgroundRepeat).toBe('repeat')
  await expect(getComputedStyle(mark).pointerEvents).toBe('none')

  const action = canvas.getByRole('button', { name: 'Run action' })
  action.focus()
  await expect(action).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(actions).toHaveTextContent('1')

  await userEvent.click(action)
  await expect(actions).toHaveTextContent('2')
})
