import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Pill } from '@115master/ui'
import { expect, within } from 'storybook/test'

const meta = {
  title: 'Components/Pill',
  component: Pill,
  parameters: {
    docs: {
      description: {
        component:
          'Pill 是信息、组合布局或导航容器，不是 daisyUI Badge，也不执行按钮动作；默认 slot 接受应用提供的内容与图标，动作应使用 Button。',
      },
    },
  },
  tags: ['autodocs', 'test'],
} satisfies Meta<typeof Pill>

export default meta
type Story = StoryObj<typeof meta>

export const Containers: Story = {
  name: '容器语义',
  render: () => ({
    components: { Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill>已选 5 项</Pill>
        <Pill as="div" variant="glass-surface">
          <span aria-hidden="true">●</span>
          组合布局容器
        </Pill>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const span = canvas.getByText('已选 5 项')
    const div = canvas.getByText(/组合布局容器/)

    await expect(span.tagName).toBe('SPAN')
    await expect(span).not.toHaveAttribute('role')
    await expect(div.tagName).toBe('DIV')
    await expect(div).not.toHaveAttribute('role', 'button')
  },
}

export const Link: Story = {
  name: '导航链接',
  render: () => ({
    components: { Pill },
    template: '<Pill as="a" href="#library" aria-current="page">媒体库</Pill>',
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: '媒体库' })

    link.focus()

    await expect(link).toHaveAttribute('href', '#library')
    await expect(link).toHaveAttribute('aria-current', 'page')
    await expect(link).toHaveFocus()
    await expect(link).not.toHaveAttribute('role', 'button')
  },
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill size="xs">XS</Pill>
        <Pill size="sm">SM</Pill>
        <Pill>MD</Pill>
        <Pill size="lg">LG</Pill>
        <Pill size="xl">XL</Pill>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const xs = canvas.getByText('XS')
    const sm = canvas.getByText('SM')
    const md = canvas.getByText('MD')
    const lg = canvas.getByText('LG')
    const xl = canvas.getByText('XL')

    await expect(xs).toBeVisible()
    await expect(sm).toBeVisible()
    await expect(md).toBeVisible()
    await expect(lg).toBeVisible()
    await expect(xl).toBeVisible()
    await expect(sm.getBoundingClientRect().height).toBeGreaterThan(xs.getBoundingClientRect().height)
    await expect(md.getBoundingClientRect().height).toBeGreaterThan(sm.getBoundingClientRect().height)
    await expect(lg.getBoundingClientRect().height).toBeGreaterThan(md.getBoundingClientRect().height)
    await expect(xl.getBoundingClientRect().height).toBeGreaterThan(lg.getBoundingClientRect().height)
  },
}

export const Variants: Story = {
  name: 'Plain 与 Glass',
  render: () => ({
    components: { Pill },
    template: `
      <div class="grid gap-3 rounded-box bg-base-200 p-5 sm:grid-cols-2">
        <Pill>Plain</Pill>
        <Pill variant="glass-surface">Surface</Pill>
        <Pill variant="glass-floating">Floating</Pill>
        <div class="rounded-box bg-neutral p-4">
          <Pill variant="glass-overlay">Overlay</Pill>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Plain')).toBeVisible()
    await expect(canvas.getByText('Surface')).toBeVisible()
    await expect(canvas.getByText('Floating')).toBeVisible()
    await expect(canvas.getByText('Overlay')).toBeVisible()
  },
}
