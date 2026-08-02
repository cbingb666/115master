import { Button, Pill } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../.storybook/preview'
import './foundation.css'

const meta = preview.meta({
  title: 'Foundations/Theme, Token and Glass',
  parameters: {
    docs: {
      description: {
        component: '公共主题、Design Token 与 Glass 材质的独立 tracer；同一视觉区域仅由最外层材质承载背景滤镜。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Tracer = meta.story({
  name: '主题、Token 与材质 tracer',
  render: () => ({
    components: { Button, Pill },
    setup() {
      const actions = ref(0)
      const act = () => actions.value += 1

      return { actions, act }
    },
    template: `
      <main class="ui-foundation-demo" data-ui-theme-tracer>
        <header class="ui-foundation-demo__intro">
          <p class="ui-foundation-demo__eyebrow">@115master/ui</p>
          <h1 class="ui-foundation-demo__title">Theme, Token and Glass tracer</h1>
          <p class="ui-foundation-demo__copy">Light 是默认主题；显式 data-theme 始终覆盖系统偏好。</p>
          <div class="ui-foundation-demo__actions">
            <button type="button" class="btn btn-sm" @click="act">daisyUI action</button>
            <output aria-live="polite" data-ui-theme-actions>{{ actions }}</output>
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
            <Pill as="div" variant="glass-surface" data-ui-filter-pill>Nested Pill stays filter-free</Pill>
            <Button variant="glass-inset" data-ui-filter-button @click="act">
              Nested Button stays filter-free
            </Button>
          </article>

          <article class="ui-foundation-demo__media">
            <div class="ui-glass-overlay ui-foundation-demo__surface">
              <p class="ui-foundation-demo__label">Overlay · standard</p>
              <p class="ui-foundation-demo__copy">媒体上方保持稳定对比度。</p>
            </div>
          </article>

          <div role="alert" class="alert alert-success ui-glass-floating" data-ui-semantic-alert>
            <span>语义 Alert 使用 Floating Glass，并保持 success 内容可读。</span>
          </div>
          <span class="text-success-content" data-ui-success-content hidden />
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
})

Tracer.test('proves Theme, Glass, and semantic action contracts', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const root = canvasElement.querySelector<HTMLElement>('[data-ui-storybook-root]')
  const tracer = canvasElement.querySelector<HTMLElement>('[data-ui-theme-tracer]')
  const owner = canvasElement.querySelector<HTMLElement>('[data-ui-filter-owner]')
  const pill = canvasElement.querySelector<HTMLElement>('[data-ui-filter-pill]')
  const button = canvasElement.querySelector<HTMLElement>('[data-ui-filter-button]')
  const alert = canvasElement.querySelector<HTMLElement>('[data-ui-semantic-alert]')
  const success = canvasElement.querySelector<HTMLElement>('[data-ui-success-content]')
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-theme-actions]')

  if (!root || !tracer || !owner || !pill || !button || !alert || !success || !actions)
    throw new Error('Theme and Glass tracer did not render its public surfaces')

  const theme = globals.theme === 'dark' ? 'dark' : 'light'
  const style = getComputedStyle(tracer)

  const daisyAction = canvas.getByRole('button', { name: 'daisyUI action' })
  const nestedAction = canvas.getByRole('button', { name: 'Nested Button stays filter-free' })

  await userEvent.click(daisyAction)
  await expect(actions).toHaveTextContent('1')
  nestedAction.focus()
  await expect(nestedAction).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await expect(actions).toHaveTextContent('2')
  await userEvent.click(nestedAction)
  await expect(actions).toHaveTextContent('3')
  await expect(root).toHaveAttribute('data-theme', theme)
  await expect(style.colorScheme).toBe(theme)
  await expect([
    '--color-base-100',
    '--ui-glass-blur-none',
    '--ui-glass-blur-standard',
    '--ui-glass-blur-strong',
    '--ui-glass-brightness',
    '--ui-ease-standard',
    '--ui-ease-enter',
    '--ui-ease-exit',
    '--ui-ease-move',
    '--ui-ease-settle',
    '--ui-ease-snap',
    '--ui-ease-linear',
    '--ui-z-dnd',
    '--ui-z-watermark',
  ].every(token => style.getPropertyValue(token).trim())).toBe(true)
  await expect(Number(style.getPropertyValue('--ui-z-watermark'))).toBeGreaterThan(
    Number(style.getPropertyValue('--ui-z-dnd')),
  )
  await expect(getComputedStyle(owner).backdropFilter).not.toBe('none')
  await expect(getComputedStyle(pill).backdropFilter).toBe('none')
  await expect(getComputedStyle(button).backdropFilter).toBe('none')
  await expect(getComputedStyle(alert).backdropFilter).not.toBe('none')
  await expect(getComputedStyle(alert).color).toBe(getComputedStyle(success).color)
})
