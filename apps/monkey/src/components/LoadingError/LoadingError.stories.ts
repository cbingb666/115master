import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { I, Icon } from '@/icons'
import { LoadingError } from './LoadingError'

const meta = {
  title: 'UI/LoadingError',
  component: LoadingError,
  args: { message: '加载失败，请检查网络连接' },
  parameters: {
    docs: {
      description: {
        component:
          '错误/警告/信息提示组件：居中图标 + 消息文本 + 可选操作按钮（重试/关闭/查看详情）。支持 4 种 type、4 档 size、自定义图标。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingError>

export default meta
type Story = StoryObj<typeof meta>

export const Types: Story = {
  name: '类型变体',
  render: () => ({
    components: { LoadingError },
    template: `
      <div class="space-y-4">
        <LoadingError type="error" message="网络连接失败，请检查后重试" />
        <LoadingError type="warning" message="存储空间不足，部分功能可能受限" />
        <LoadingError type="info" message="正在同步数据，请稍候" />
        <LoadingError type="success" message="操作已成功完成" />
      </div>
    `,
  }),
}

export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    components: { LoadingError },
    template: `
      <div class="space-y-4">
        <LoadingError size="mini" message="mini · 迷你提示" />
        <LoadingError size="small" message="small · 小号提示" />
        <LoadingError size="medium" message="medium · 默认尺寸" />
        <LoadingError size="large" message="large · 大号提示" />
      </div>
    `,
  }),
}

export const Retryable: Story = {
  name: '可重试',
  render: () => ({
    components: { LoadingError },
    template: `
      <div class="space-y-4">
        <LoadingError retryable message="加载超时" retry-text="重新加载" />
        <LoadingError type="warning" retryable message="部分数据获取失败" retry-text="重试" size="large" />
      </div>
    `,
  }),
}

export const Closable: Story = {
  name: '可关闭',
  render: () => ({
    components: { LoadingError },
    template: `
      <LoadingError closable type="info" message="这是一条可关闭的提示" close-text="知道了" />
    `,
  }),
}

export const WithErrorDetail: Story = {
  name: '含错误详情',
  parameters: {
    docs: {
      description: {
        story: '传入 `Error` 实例时自动显示"查看错误"按钮，点击复制错误信息到剪贴板并弹窗。',
      },
    },
  },
  render: () => ({
    components: { LoadingError },
    template: `
      <LoadingError :message="new Error('ECONNREFUSED: Connection refused')" />
    `,
  }),
}

export const NoPadding: Story = {
  name: '无内边距',
  render: () => ({
    components: { LoadingError },
    template: `
      <div class="border border-base-content/20 rounded-xl p-2">
        <LoadingError no-padding size="mini" message="紧凑模式，无额外 padding" />
      </div>
    `,
  }),
}

export const CustomIcon: Story = {
  name: '自定义图标',
  render: () => ({
    components: { LoadingError, Icon },
    setup: () => ({ I }),
    template: `
      <div class="space-y-4">
        <LoadingError :icon="I.TOAST_WARNING" type="warning" message="使用 TOAST_WARNING 图标" />
        <LoadingError :icon="I.EMPTY" type="info" message="使用 EMPTY 图标" />
      </div>
    `,
  }),
}
