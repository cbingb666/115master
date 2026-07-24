import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Button from '../Button/Button'
import Progress from './Progress'

const meta = {
  title: 'UI/Progress',
  component: Progress,
  args: { active: true },
  parameters: {
    docs: {
      description: {
        component:
          '顶部 indeterminate 进度条：`active=true` 启动无限循环扫光动画；`active=false` 播放退出动画后消失。固定定位在页面顶部（z-9999），不影响布局。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Active: Story = {
  name: '进行中',
  args: { active: true },
}

export const Inactive: Story = {
  name: '已结束（退出动画）',
  args: { active: false },
}

export const Toggle: Story = {
  name: '启动 → 结束',
  parameters: {
    docs: {
      description: {
        story: '点击按钮切换 active 状态，观察进度条启动动画（从左到右扫光）与退出动画（滑出右边界 + 淡出）。',
      },
    },
  },
  render: () => ({
    components: { Button, Progress },
    setup: () => {
      const active = ref(true)
      return { active }
    },
    template: `
      <div>
        <Progress :active="active" />
        <Button color="primary" type="button" class="mt-16" @click="active = !active">
          {{ active ? '停止' : '启动' }} 进度条
        </Button>
      </div>
    `,
  }),
}
