import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button } from '@115master/ui'
import logo from '@/assets/logo.svg?url'
import { I, Icon } from '@/icons'
import Empty from './Empty'

const meta = {
  title: 'UI/Empty',
  component: Empty,
  args: { description: '暂无数据' },
  parameters: {
    docs: {
      description: {
        component:
          '空状态占位组件：居中图标（icon/自定义图片） + 描述文本 + 可选底部操作区（slot）。6 档尺寸自适应。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
  render: () => ({
    components: { Empty },
    template: `<Empty />`,
  }),
}

export const CustomDescription: Story = {
  name: '自定义描述',
  render: () => ({
    components: { Button, Empty },
    template: `
      <div class="space-y-6">
        <Empty description="没有找到相关文件" />
        <Empty description="文件夹为空">
          <Button color="primary" size="sm" type="button">上传文件</Button>
        </Empty>
      </div>
    `,
  }),
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { Empty },
    template: `
      <div class="space-y-6">
        <Empty size="xs" description="xs · 迷你" />
        <Empty size="sm" description="sm · 小" />
        <Empty size="md" description="md · 默认" />
        <Empty size="lg" description="lg · 大" />
        <Empty size="xl" description="xl · 超大" />
        <Empty size="2xl" description="2xl · 巨大" />
      </div>
    `,
  }),
}

export const CustomIcon: Story = {
  name: '自定义图标',
  render: () => ({
    components: { Empty, Icon },
    setup: () => ({ I }),
    template: `
      <div class="space-y-6">
        <Empty :icon="I.ALL_FILE" description="使用 I.ALL_FILE 图标" />
        <Empty :icon="I.SEARCH" description="使用 I.SEARCH 图标" />
        <Empty :icon="I.DELETE" description="使用 I.DELETE 图标" size="lg" />
      </div>
    `,
  }),
}

export const CustomImage: Story = {
  name: '自定义图片',
  render: () => ({
    components: { Empty },
    setup: () => ({ image: logo }),
    template: `
      <Empty :image="image" description="使用自定义图片" size="lg" />
    `,
  }),
}

export const WithAction: Story = {
  name: '带操作按钮',
  render: () => ({
    components: { Button, Empty },
    setup: () => ({ I }),
    template: `
      <div class="space-y-6">
        <Empty description="还没有上传过文件">
          <Button color="primary" size="sm" type="button">立即上传</Button>
        </Empty>
        <Empty description="连接已断开" :icon="I.ERROR" size="lg">
          <Button variant="outline" size="sm" type="button">重新连接</Button>
        </Empty>
      </div>
    `,
  }),
}

export const HideImage: Story = {
  name: '隐藏图标区',
  render: () => ({
    components: { Empty },
    template: `
      <Empty :show-image="false" description="纯文字空状态，无图标/图片区域" />
    `,
  }),
}
