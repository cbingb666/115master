import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Action } from '@/types/action'
import { I } from '@/icons'
import ActionBar from './ActionBar'

const groups = [
  [
    { name: 'download', label: '下载', icon: I.DOWNLOAD },
    { name: 'move', label: '移动', icon: I.MOVE },
  ],
  [
    { name: 'delete', label: '删除', icon: I.DELETE, iconColor: 'text-error' },
  ],
] satisfies Action[][]

const meta = {
  title: 'UI/ActionBar',
  component: ActionBar,
  parameters: {
    docs: {
      description: {
        component: '通用分组操作栏，统一处理操作的显隐、激活状态与异步加载反馈。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionBar>

export default meta
type Story = StoryObj<typeof meta>

export const Grouped: Story = {
  name: '分组操作',
  args: { groups },
}

export const Async: Story = {
  name: '异步操作',
  args: {
    groups: [[
      {
        name: 'download',
        label: '下载',
        icon: I.DOWNLOAD,
        onClick: () => new Promise(resolve => setTimeout(resolve, 1200)),
      },
    ]],
  },
}
