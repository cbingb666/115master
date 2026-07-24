import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from '../Button/Button'
import Pill from './Pill'

const meta = {
  title: 'UI/Pill',
  component: Pill,
  parameters: {
    docs: {
      description: {
        component:
          '胶囊容器：plain 只提供几何，glass-surface、glass-floating、glass-overlay 与 Button 共享同名场景材质；可执行动作始终使用 Button。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pill>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  name: '承载场景',
  render: () => ({
    components: { Pill },
    template: `
      <div class="app-bg-mesh grid gap-4 rounded-3xl p-8 md:grid-cols-2">
        <div class="bg-base-100/60 rounded-2xl p-4">
          <p class="text-base-content/60 mb-3 text-xs">Plain：仅几何</p>
          <Pill>已选 5 项</Pill>
        </div>
        <div class="bg-base-100/60 rounded-2xl p-4">
          <p class="text-base-content/60 mb-3 text-xs">Surface：面板内部</p>
          <Pill variant="glass-surface">根目录</Pill>
        </div>
        <div class="bg-base-100/60 rounded-2xl p-4">
          <p class="text-base-content/60 mb-3 text-xs">Floating：页面上方悬浮</p>
          <Pill variant="glass-floating">播放器控制组</Pill>
        </div>
        <div class="relative overflow-hidden rounded-2xl bg-neutral p-4">
          <p class="text-neutral-content/70 mb-3 text-xs">Overlay：图片或视频上方</p>
          <Pill variant="glass-overlay">00:35 / 02:02:40</Pill>
        </div>
      </div>
    `,
  }),
}

export const Interactive: Story = {
  name: '链接与动作',
  render: () => ({
    components: { Button, Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill as="a" variant="glass-surface" href="#pill-link">链接 Pill</Pill>
        <Button variant="glass-surface">动作 Button</Button>
      </div>
    `,
  }),
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill size="xs" variant="glass-surface">XS</Pill>
        <Pill size="sm" variant="glass-surface">SM</Pill>
        <Pill>MD</Pill>
        <Pill size="lg" variant="glass-floating">LG</Pill>
        <Pill size="xl" variant="glass-overlay">XL</Pill>
      </div>
    `,
  }),
}

export const Composite: Story = {
  name: '组合按钮',
  render: () => ({
    components: { Button, Pill },
    template: `
      <div class="app-bg-mesh rounded-3xl p-8">
        <Pill as="div" variant="glass-floating" class="h-auto gap-1 p-1.5">
          <Button variant="ghost" shape="circle">1</Button>
          <Button variant="glass-inset" shape="circle" aria-current="page">2</Button>
          <Button variant="ghost" shape="circle">3</Button>
        </Pill>
      </div>
    `,
  }),
}
