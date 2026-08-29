import type { ActionMenuGroup } from '@115master/ui'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Pill } from '@115master/ui'
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
  render: args => ({
    components: { ActionBar, Pill },
    setup: () => ({ args }),
    template: `
      <div class="flex min-h-48 items-center justify-center bg-base-200 p-6">
        <Pill as="div" variant="glass-floating" size="md" class="p-0">
          <ActionBar v-bind="args" />
        </Pill>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          '通用分组操作栏：统一处理操作分组、显隐、激活状态与异步加载反馈；调用方拥有 Pill 或 Glass 承载表面。',
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
