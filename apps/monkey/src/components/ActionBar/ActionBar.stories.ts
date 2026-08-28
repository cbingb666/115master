import type { ActionMenuGroup } from '@115master/ui'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { I } from '@/icons'
import { actionIcon } from '@/utils/action'
import ActionBar from './ActionBar'

const groups = [
  [
    { id: 'download', label: '下载', leading: actionIcon(I.DOWNLOAD), onSelect: () => {} },
    { id: 'move', label: '移动', leading: actionIcon(I.MOVE), onSelect: () => {} },
  ],
  [
    { id: 'delete', label: '删除', leading: actionIcon(I.DELETE), tone: 'destructive', onSelect: () => {} },
  ],
] satisfies ActionMenuGroup[]

const meta = {
  title: 'UI/ActionBar',
  component: ActionBar,
  parameters: {
    docs: {
      description: {
        component:
          '通用分组操作栏：glass-floating Pill 承载分组，ghost Button 统一处理操作的显隐、激活状态与异步加载反馈。',
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
        id: 'download',
        label: '下载',
        leading: actionIcon(I.DOWNLOAD),
        onSelect: () => new Promise(resolve => setTimeout(resolve, 1200)),
      },
    ]],
  },
}
