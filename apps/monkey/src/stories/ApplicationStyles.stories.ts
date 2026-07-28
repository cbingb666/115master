import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button, Pill } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'

const meta = {
  title: 'Integrations/Application Styles',
  parameters: {
    docs: {
      description: {
        component:
          'Monkey 只在公共 UI 样式之后追加应用背景，以及 range、skeleton、input 与 textarea 的应用级 daisyUI overrides。',
      },
    },
  },
  tags: ['autodocs', 'test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const ThemeComposition: Story = {
  name: '应用样式组合',
  render: () => ({
    components: { Button, Pill },
    setup() {
      const saves = ref(0)
      const save = () => saves.value += 1

      return { saves, save }
    },
    template: `
      <main class="app-bg-mesh bg-base-100 text-base-content min-h-screen p-6 sm:p-10">
        <section class="ui-glass-panel mx-auto grid max-w-3xl gap-6 rounded-3xl p-6 sm:p-8">
          <header>
            <p class="text-base-content/60 text-sm">Monkey integration</p>
            <h1 class="text-2xl font-semibold">Application-owned styles</h1>
          </header>

          <div class="grid gap-5 sm:grid-cols-2">
            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-medium">播放器音量</span>
              <input
                type="range"
                min="0"
                max="100"
                value="60"
                class="range app-range-2xs range-primary min-w-0"
              >
            </label>

            <div class="grid min-w-0 gap-2" aria-label="加载占位">
              <span class="text-sm font-medium">媒体信息</span>
              <div class="skeleton h-8 w-full" />
            </div>

            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-medium">名称</span>
              <input class="input min-w-0 w-full" value="115Master">
            </label>

            <label class="grid min-w-0 gap-2">
              <span class="text-sm font-medium">备注</span>
              <textarea class="textarea min-w-0 w-full" rows="2">应用专属内容</textarea>
            </label>
          </div>

          <Pill as="div" variant="glass-surface" class="h-auto justify-between gap-3 p-2">
            <span class="px-2 text-sm">
              公共 Glass 承载应用控件
              <output class="block text-xs opacity-70" aria-live="polite" data-app-style-saves>
                已保存 {{ saves }} 次
              </output>
            </span>
            <Button variant="glass-inset" @click="save">保存</Button>
          </Pill>
        </section>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const saves = canvasElement.querySelector<HTMLOutputElement>('[data-app-style-saves]')

    if (!saves)
      throw new Error('Application styles story did not render its save outcome')

    const save = canvas.getByRole('button', { name: '保存' })

    await userEvent.click(save)
    await expect(saves).toHaveTextContent('已保存 1 次')
    save.focus()
    await expect(save).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(saves).toHaveTextContent('已保存 2 次')
  },
}
