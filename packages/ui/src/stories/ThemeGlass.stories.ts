import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { expect, within } from 'storybook/test'
import './foundation.css'

const meta = {
  title: 'Foundations/Theme and Glass',
  parameters: {
    docs: {
      description: {
        component: '公共主题、Design Token 与 Glass 材质的独立 tracer；同一视觉区域仅由最外层材质承载背景滤镜。',
      },
    },
  },
  tags: ['autodocs', 'test'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Tracer: Story = {
  name: '主题与材质 tracer',
  render: () => ({
    template: `
      <main class="ui-foundation-demo" data-ui-theme-tracer>
        <header class="ui-foundation-demo__intro">
          <p class="ui-foundation-demo__eyebrow">@115master/ui</p>
          <h1 class="ui-foundation-demo__title">Theme and Glass tracer</h1>
          <p class="ui-foundation-demo__copy">Light 是默认主题；显式 data-theme 始终覆盖系统偏好。</p>
          <div class="ui-foundation-demo__actions">
            <button type="button" class="btn btn-sm">daisyUI action</button>
          </div>
        </header>

        <section class="ui-foundation-demo__grid" aria-label="Glass 场景">
          <article class="ui-glass-surface ui-foundation-demo__surface">
            <p class="ui-foundation-demo__label">Surface · none</p>
            <p class="ui-foundation-demo__copy">面板内部的弱层次，不创建新的合成层。</p>
          </article>

          <article class="ui-glass-inset ui-foundation-demo__surface">
            <p class="ui-foundation-demo__label">Inset · none</p>
            <p class="ui-foundation-demo__copy">浮层内的选中信息，维持单层滤镜。</p>
          </article>

          <article class="ui-glass-floating ui-foundation-demo__stack" data-ui-filter-owner>
            <p class="ui-foundation-demo__label">Floating · standard</p>
            <div class="ui-glass-inset ui-foundation-demo__inset" data-ui-filter-inset>Inset stays filter-free</div>
          </article>

          <article class="ui-foundation-demo__media">
            <div class="ui-glass-overlay ui-foundation-demo__surface">
              <p class="ui-foundation-demo__label">Overlay · standard</p>
              <p class="ui-foundation-demo__copy">媒体上方保持稳定对比度。</p>
            </div>
          </article>
        </section>

        <section class="ui-glass-panel ui-foundation-demo__panel">
          <div>
            <p class="ui-foundation-demo__label">Panel · strong</p>
            <h2>结构性浮层</h2>
            <p class="ui-foundation-demo__copy">大型侧栏、Sheet 与对话框外壳使用较强的单层材质。</p>
          </div>
          <div class="ui-glass-surface ui-foundation-demo__inset">Panel 内部的 Surface 不再叠加 blur。</div>
        </section>
      </main>
    `,
  }),
  play: async ({ canvasElement, globals }) => {
    const canvas = within(canvasElement)
    const root = canvasElement.querySelector<HTMLElement>('[data-ui-storybook-root]')
    const tracer = canvasElement.querySelector<HTMLElement>('[data-ui-theme-tracer]')
    const owner = canvasElement.querySelector<HTMLElement>('[data-ui-filter-owner]')
    const inset = canvasElement.querySelector<HTMLElement>('[data-ui-filter-inset]')

    if (!root || !tracer || !owner || !inset)
      throw new Error('Theme and Glass tracer did not render its public surfaces')

    const theme = globals.theme === 'dark' ? 'dark' : 'light'
    const base = getComputedStyle(tracer).getPropertyValue('--color-base-100').trim()

    await expect(canvas.getByRole('button', { name: 'daisyUI action' })).toBeVisible()
    await expect(root).toHaveAttribute('data-theme', theme)
    await expect(base).toBe(theme === 'dark' ? 'oklch(0% 0 0)' : 'oklch(100% 0 0)')
    await expect(getComputedStyle(owner).backdropFilter).not.toBe('none')
    await expect(getComputedStyle(inset).backdropFilter).toBe('none')
  },
}
