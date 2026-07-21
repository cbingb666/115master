import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { I, Icon } from '@/icons'
import Tooltip from './Tooltip.vue'

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component:
          'Portal tooltip：复用 daisyUI `.tooltip` 伪元素（视觉与其他 tooltip 完全一致），通过 Teleport 到 #my-app + fixed 定位绕开父级 overflow / sticky stacking 裁切。适用于嵌在 overflow-hidden 容器内的触发元素（如 Dialog 工具栏）。悬停触发元素查看效果。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基本',
  render: () => ({
    components: { Tooltip, Icon },
    setup: () => ({ I }),
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <Tooltip content="新建文件夹">
          <button type="button" class="btn btn-glass rounded-full">
            <Icon :name="I.NEW_FOLDER" class="text-xl" />
          </button>
        </Tooltip>
        <Tooltip content="列表视图">
          <button type="button" class="btn btn-glass rounded-full">
            <Icon :name="I.LIST" class="text-xl" />
          </button>
        </Tooltip>
        <Tooltip content="每页 30 项">
          <button type="button" class="btn btn-glass rounded-full">
            <Icon :name="I.DOCUMENT" class="text-2xl" />
          </button>
        </Tooltip>
        <Tooltip content="当前排序：修改时间">
          <button type="button" class="btn btn-glass rounded-full">
            <Icon :name="I.SORT" class="text-xl" />
          </button>
        </Tooltip>
        <p class="w-full text-sm opacity-60">悬停按钮查看 tooltip</p>
      </div>
    `,
  }),
}

export const Placement: Story = {
  name: '方向',
  render: () => ({
    components: { Tooltip },
    template: `
      <div class="flex flex-col items-center gap-24 py-16">
        <Tooltip content="出现在下方" placement="bottom">
          <button type="button" class="btn btn-glass rounded-full">placement: bottom</button>
        </Tooltip>
        <Tooltip content="出现在上方" placement="top">
          <button type="button" class="btn btn-glass rounded-full">placement: top</button>
        </Tooltip>
      </div>
    `,
  }),
}

export const Overflow: Story = {
  name: '嵌套 overflow 容器',
  parameters: {
    docs: {
      description: {
        story: '触发元素位于 overflow-hidden + sticky 容器内（模拟 Dialog 工具栏），tooltip 仍能正常溢出显示——这正是 portal 方案的核心价值。',
      },
    },
  },
  render: () => ({
    components: { Tooltip, Icon },
    setup: () => ({ I }),
    template: `
      <div class="overflow-hidden rounded-3xl border border-base-content/20">
        <div class="sticky top-0 z-10 flex items-center gap-2 bg-base-200 px-4 py-3">
          <Tooltip content="新建">
            <button type="button" class="btn btn-glass rounded-full">
              <Icon :name="I.NEW_FOLDER" class="text-xl" />
            </button>
          </Tooltip>
          <Tooltip content="列表">
            <button type="button" class="btn btn-glass rounded-full">
              <Icon :name="I.LIST" class="text-xl" />
            </button>
          </Tooltip>
          <span class="text-sm opacity-60">外层 overflow-hidden + sticky，tooltip 仍正常溢出</span>
        </div>
        <div class="h-40 overflow-y-auto p-4 text-sm opacity-70">
          <p>滚动内容区。tooltip 通过 portal 脱离了这里的 overflow 限制。</p>
          <p v-for="n in 12" :key="n">行 {{ n }}</p>
        </div>
      </div>
    `,
  }),
}
