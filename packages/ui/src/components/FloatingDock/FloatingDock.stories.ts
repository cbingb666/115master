import type { FloatingDockContentKey } from '@115master/ui'
import { FloatingDock } from '@115master/ui'
import preview from '../../../.storybook/preview'

const keys = [null, 'compact', 'wide'] as const satisfies readonly (FloatingDockContentKey | null)[]

const meta = preview.meta({
  title: 'UI/FloatingDock',
  component: FloatingDock,
  args: {
    contentKey: null,
  },
  argTypes: {
    contentKey: {
      control: 'select',
      options: keys,
      description: 'null 隐藏表面；其他值标识当前内容与切换时机。',
    },
  },
  render: args => ({
    components: { FloatingDock },
    setup: () => ({ args }),
    template: `
      <div class="flex min-h-72 flex-col bg-linear-to-br from-primary/35 via-base-200 to-accent/30 p-8">
        <p class="m-0 text-sm text-base-content/65">页面拥有背景与定位容器</p>
        <div class="pointer-events-none mt-auto flex justify-center pt-16">
          <FloatingDock v-bind="args">
            <div
              v-if="args.contentKey === 'wide'"
              class="flex items-center gap-3 px-5 py-3"
            >
              <span class="font-medium">较宽的操作内容</span>
              <span class="text-sm text-base-content/60">3 项可用</span>
            </div>
            <div v-else class="px-4 py-3 font-medium">紧凑内容</div>
          </FloatingDock>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          '底部浮动控件的连续 Glass 表面：contentKey 控制显隐和内容身份，组件统一处理内容淡入淡出与 ResizeObserver 几何过渡；页面负责定位和背景羽化。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认隐藏',
})

export const Visible = meta.story({
  name: '显示内容',
  args: {
    contentKey: 'compact',
  },
})
