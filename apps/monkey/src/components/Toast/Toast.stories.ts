import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Toast } from './Toast'

const meta = {
  title: 'UI/Toast',
  component: Toast,
  args: { id: 'demo', content: '这是一条通知消息', type: 'info' as const, duration: 0 },
  parameters: {
    docs: {
      description: {
        component:
          '通知提示条：4 种语义类型（success/error/warning/info），自动计时关闭（duration > 0），可手动关闭（closable），支持 title/content/icon 三个 slot。由 ToastContainer 管理堆叠与定位。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>

export default meta
type Story = StoryObj<typeof meta>

export const Types: Story = {
  name: '类型变体',
  render: () => ({
    components: { Toast },
    template: `
      <div class="space-y-3">
        <Toast id="s1" type="success" content="文件上传成功" :duration="0" />
        <Toast id="e1" type="error" content="删除失败，请重试" :duration="0" />
        <Toast id="w1" type="warning" content="存储空间即将用尽" :duration="0" />
        <Toast id="i1" type="info" content="新版本 v2.0 已发布" :duration="0" />
      </div>
    `,
  }),
}

export const WithTitle: Story = {
  name: '带标题',
  render: () => ({
    components: { Toast },
    template: `
      <div class="space-y-3">
        <Toast id="t1" type="success" title="操作成功" content="3 个文件已移动到目标文件夹" :duration="0" />
        <Toast id="t2" type="error" title="操作失败" content="权限不足，无法删除该文件" :duration="0" />
        <Toast id="t3" type="warning" title="注意" content="该操作不可撤销，请确认后再执行" :duration="0" />
      </div>
    `,
  }),
}

export const NotClosable: Story = {
  name: '不可手动关闭',
  render: () => ({
    components: { Toast },
    template: `
      <Toast id="nc1" type="info" content="正在处理，请稍候..." :closable="false" :duration="0" />
    `,
  }),
}

export const LongContent: Story = {
  name: '长文本内容',
  render: () => ({
    components: { Toast },
    template: `
      <Toast
        id="lc1"
        type="info"
        title="同步完成"
        content="已从云端同步 1,234 个文件，其中新增 56 个，更新 12 个，冲突 3 个。请前往冲突处理页面查看详情。"
        :duration="0"
      />
    `,
  }),
}
