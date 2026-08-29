import type { PillSize, PillVariant } from '@115master/ui'
import { Pill } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import preview from '../../../.storybook/preview'

const variants = [
  'plain',
  'soft',
  'glass-surface',
  'glass-floating',
  'glass-overlay',
] as const satisfies readonly PillVariant[]

const sizes = [
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
] as const satisfies readonly PillSize[]

const meta = preview.meta({
  title: 'UI/Pill',
  component: Pill,
  args: {
    as: 'span',
    variant: 'plain',
    size: 'md',
  },
  argTypes: {
    as: { control: false },
    href: { control: false },
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: sizes },
  },
  render: args => ({
    components: { Pill },
    setup: () => ({ args }),
    template: '<div class="p-6"><Pill v-bind="args">Status label</Pill></div>',
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Pill 是胶囊几何的信息、组合布局或导航容器；用于承载简短内容或链接。它不是 Badge，也不执行按钮动作。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Sizes = meta.story({
  name: '尺寸',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Pill },
    setup: () => ({ sizes }),
    template: `
      <section aria-label="Pill sizes" class="flex flex-wrap items-center gap-3 p-6">
        <Pill v-for="size in sizes" :key="size" :size="size">
          {{ size }}
        </Pill>
      </section>
    `,
  }),
})

export const Content = meta.story({
  name: '内容组合',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Pill },
    template: `
      <section aria-label="Pill content" class="flex flex-wrap items-center gap-3 p-6">
        <Pill>Draft</Pill>
        <Pill as="div">
          <svg aria-hidden="true" viewBox="0 0 16 16" class="size-3" fill="currentColor">
            <path d="m6.5 11.2-3-3 1.4-1.4 1.6 1.6 4.6-4.6 1.4 1.4-6 6Z" />
          </svg>
          <span>Synced</span>
        </Pill>
        <Pill as="div">
          <span>3 items</span>
          <span aria-hidden="true">·</span>
          <span>selected</span>
        </Pill>
      </section>
    `,
  }),
})

export const GlassVariants = meta.story({
  name: 'Glass 变体',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Pill },
    template: `
      <section aria-label="Pill variants" class="grid gap-4 bg-base-200 p-6 sm:grid-cols-2">
        <div class="rounded-box bg-base-100 p-6">
          <Pill>Plain</Pill>
        </div>
        <div class="rounded-box bg-base-100 p-6">
          <Pill as="a" href="#soft" variant="soft">Soft</Pill>
        </div>
        <div class="rounded-box bg-base-100 p-6">
          <Pill variant="glass-surface">Surface</Pill>
        </div>
        <div
          class="rounded-box p-6"
          style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary) 50%, var(--color-neutral))"
        >
          <Pill variant="glass-floating">Floating</Pill>
        </div>
        <div class="rounded-box bg-neutral p-6">
          <Pill variant="glass-overlay">Overlay</Pill>
        </div>
      </section>
    `,
  }),
})

export const Navigation = meta.story({
  name: '导航链接',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Pill },
    template: `
      <nav aria-label="Pill navigation" class="p-6">
        <Pill as="a" href="#details" aria-current="page">Current section</Pill>
      </nav>
    `,
  }),
})

Navigation.test('exposes native link semantics and keyboard focus', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const link = canvas.getByRole('link', { name: 'Current section' })

  await expect(link).toHaveAttribute('href', '#details')
  await expect(link).toHaveAttribute('aria-current', 'page')
  await expect(link).not.toHaveAttribute('role', 'button')

  await userEvent.tab()
  await expect(link).toHaveFocus()
})
