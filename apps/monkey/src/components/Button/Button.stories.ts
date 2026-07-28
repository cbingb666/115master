import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Pill } from '@115master/ui'
import { I, Icon } from '@/icons'
import Button from './Button'

const colors = [
  'default',
  'neutral',
  'primary',
  'secondary',
  'accent',
  'info',
  'success',
  'warning',
  'error',
] as const

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          '项目唯一按钮原子：颜色使用 daisyUI 标准语义色，常规样式使用标准变体；玻璃样式按 surface、inset、floating、overlay 四种承载场景区分。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Colors: Story = {
  name: '标准颜色',
  render: () => ({
    components: { Button },
    setup: () => ({ colors }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button v-for="color in colors" :key="color" :color="color">
          {{ color }}
        </Button>
      </div>
    `,
  }),
}

export const Variants: Story = {
  name: '标准样式',
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button>Solid</Button>
        <Button variant="soft" color="primary">Soft</Button>
        <Button variant="outline" color="primary">Outline</Button>
        <Button variant="dash" color="primary">Dash</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    `,
  }),
}

export const Glass: Story = {
  name: '玻璃场景',
  render: () => ({
    components: { Button, Icon, Pill },
    setup: () => ({ I }),
    template: `
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="bg-base-200 rounded-3xl p-6">
          <p class="text-base-content/60 mb-4 text-sm">Surface：面板内部</p>
          <Button variant="glass-surface">
            <Icon :name="I.SETTINGS" />
            设置
          </Button>
        </div>
        <div class="app-bg-mesh rounded-3xl p-6">
          <p class="text-base-content/60 mb-4 text-sm">Inset：Float Glass 内部选中项</p>
          <Pill as="div" variant="glass-floating" class="h-auto gap-1 p-1.5">
            <Button variant="ghost" shape="circle">1</Button>
            <Button variant="glass-inset" shape="circle" aria-current="page">2</Button>
            <Button variant="ghost" shape="circle">3</Button>
          </Pill>
        </div>
        <div class="app-bg-mesh rounded-3xl p-6">
          <p class="text-base-content/60 mb-4 text-sm">Floating：页面上方悬浮</p>
          <Button variant="glass-floating" shape="circle" aria-label="搜索">
            <Icon :name="I.SEARCH" />
          </Button>
        </div>
        <div class="bg-neutral rounded-3xl p-6">
          <p class="text-neutral-content/70 mb-4 text-sm">Overlay：图片或视频上方</p>
          <Button variant="glass-overlay">
            <Icon :name="I.PLAY" />
            继续播放
          </Button>
        </div>
      </div>
    `,
  }),
}

export const States: Story = {
  name: '尺寸与状态',
  render: () => ({
    components: { Button, Icon, Pill },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Button size="xs">XS</Button>
        <Button size="sm">SM</Button>
        <Button>MD</Button>
        <Button size="lg">LG</Button>
        <Button size="xl">XL</Button>
        <Button shape="circle" aria-label="播放"><Icon :name="I.PLAY" /></Button>
        <Button color="primary" active>Active</Button>
        <Button disabled>Disabled</Button>
        <Button loading>Loading</Button>
      </div>
    `,
  }),
}

export const Disabled: Story = {
  name: '禁用状态',
  render: () => ({
    components: { Button, Icon },
    setup: () => ({ I }),
    template: `
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div class="bg-base-200 flex items-center gap-3 rounded-3xl p-6">
          <Button disabled>Solid</Button>
          <Button variant="ghost" shape="circle" disabled aria-label="Ghost">
            <Icon :name="I.SETTINGS" />
          </Button>
        </div>
        <div class="app-bg-mesh flex items-center rounded-3xl p-6">
          <Pill as="div" variant="glass-floating" class="h-auto p-1.5">
            <Button variant="glass-inset" shape="circle" disabled aria-label="Inset">
              2
            </Button>
          </Pill>
        </div>
        <div class="app-bg-mesh flex items-center rounded-3xl p-6">
          <Button variant="glass-floating" shape="circle" disabled aria-label="Floating">
            <Icon :name="I.SEARCH" />
          </Button>
        </div>
        <div class="bg-neutral flex items-center rounded-3xl p-6">
          <Button variant="glass-overlay" disabled>
            <Icon :name="I.PLAY" />
            Overlay
          </Button>
        </div>
      </div>
    `,
  }),
}
