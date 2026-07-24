import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from '../components/Button/Button'
import Pill from '../components/Pill/Pill'

const meta = {
  title: 'Foundations/Glass',
  parameters: {
    docs: {
      description: {
        component:
          '统一 Glass 材质体系：调用层只选择 surface、inset、floating、overlay 或 panel 场景；none、standard、strong 三档模糊及边框、高光和阴影都由材质生成。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Scenes: Story = {
  name: '场景体系',
  render: () => ({
    components: { Button, Pill },
    template: `
      <div class="app-bg-mesh grid gap-6 rounded-3xl p-8 xl:grid-cols-2">
        <section class="app-glass-panel rounded-3xl p-6">
          <p class="text-base-content/60 mb-4 text-sm">Panel · strong：侧栏、抽屉和大型弹层</p>
          <div class="app-glass-surface rounded-2xl p-4">
            <p class="text-base-content/60 mb-3 text-xs">Surface · none：面板内部弱层次</p>
            <Button variant="glass-surface">面板操作</Button>
          </div>
        </section>

        <section class="flex flex-col gap-6">
          <div>
            <p class="text-base-content/60 mb-3 text-sm">Floating · standard + Inset · none</p>
            <Pill as="div" variant="glass-floating" class="h-auto gap-1 p-1.5">
              <Button variant="ghost" shape="circle">1</Button>
              <Button variant="glass-inset" shape="circle" aria-current="page">2</Button>
              <Button variant="ghost" shape="circle">3</Button>
            </Pill>
          </div>

          <div class="bg-neutral rounded-3xl p-6">
            <p class="text-neutral-content/70 mb-3 text-sm">Overlay · standard：图片或视频上方</p>
            <Button variant="glass-overlay">继续播放</Button>
          </div>
        </section>
      </div>
    `,
  }),
}
