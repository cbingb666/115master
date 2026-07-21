import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SelectionHeader from './SelectionHeader'

const meta = {
  title: 'UI/SelectionHeader',
  component: SelectionHeader,
  parameters: {
    docs: {
      description: {
        component:
          '多选头部：退出多选 + 已选计数 + 全选/反选。自包含完整 Header（内部组合 Header + HeaderStart/HeaderEnd），调用处直接渲染即可。事件通过 props 传入。',
      },
    },
  },
  tags: ['autodocs'],
  args: {
    count: 5,
    onExit: () => {},
    onSelectAll: () => {},
    onInvert: () => {},
  },
} satisfies Meta<typeof SelectionHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
}

export const ExitOnly: Story = {
  name: '仅退出',
  parameters: {
    docs: {
      description: {
        story: '不传 onSelectAll / onInvert 时只渲染退出按钮，适用于不支持全选/反选的场景。',
      },
    },
  },
  args: {
    onSelectAll: undefined,
    onInvert: undefined,
  },
}
