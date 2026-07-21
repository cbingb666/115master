import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Pill from '@/components/Pill/Pill'

const meta = {
  title: 'UI/Pill',
  component: Pill,
  parameters: {
    docs: {
      description: {
        component:
          '玻璃 Pill（`.pill`，`src/styles/ui-extend.css`）：半透明底 + 背景模糊饱和 + 边缘高光 + 柔和投影。非 btn 的悬浮控件使用；`a` / `button` 标签自动获得交互态。',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
  render: () => ({
    components: { Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill>根目录</Pill>
        <Pill>Test Video</Pill>
        <Pill>已选 5 项</Pill>
      </div>
    `,
  }),
}

export const Interactive: Story = {
  name: '可交互',
  render: () => ({
    components: { Pill },
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Pill as="a" href="javascript:void(0)">链接 Pill</Pill>
        <Pill as="button">按钮 Pill</Pill>
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
        <Pill class="pill-xs">XS</Pill>
        <Pill class="pill-sm">SM</Pill>
        <Pill>MD</Pill>
        <Pill class="pill-lg">LG</Pill>
        <Pill class="pill-xl">XL</Pill>
      </div>
    `,
  }),
}
