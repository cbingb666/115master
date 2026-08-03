import { Button, Pill } from '@115master/ui'
import { expect, within } from 'storybook/test'
import preview from '../../../.storybook/preview'
import './Glass.css'
import './GlassLayout.css'

const meta = preview.meta({
  title: 'Foundations/Glass',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Glass 是按承载场景选择的半透明表面；用于在真实背景上统一前景、边缘、阴影与背景滤镜。它不是透明背景工具类，同一视觉区域只允许最外层材质拥有滤镜。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Materials = meta.story({
  name: '材质场景',
  render: () => ({
    template: `
      <main class="ui-foundation-demo ui-glass-story">
        <header class="ui-foundation-demo__intro">
          <p class="ui-foundation-demo__eyebrow">Foundations · Glass</p>
          <h1 class="ui-foundation-demo__title">Materials by carrying context</h1>
          <p class="ui-foundation-demo__copy">每种材质都在其真实承载背景中展示；名称表达场景，不表达透明度数值。</p>
        </header>

        <section aria-label="Glass materials" class="ui-glass-story__materials">
          <article class="ui-glass-story__stage ui-glass-story__stage--quiet">
            <div class="ui-glass-surface ui-glass-story__card">
              <p class="ui-foundation-demo__label">Surface · no filter</p>
              <h2>Supporting surface</h2>
              <p>面板内部的弱层次，不创建新的合成层。</p>
            </div>
          </article>

          <article class="ui-glass-story__stage ui-glass-story__stage--quiet">
            <div class="ui-glass-inset ui-glass-story__card">
              <p class="ui-foundation-demo__label">Inset · no filter</p>
              <h2>Selected information</h2>
              <p>浮层内部的选中区域，维持单层滤镜。</p>
            </div>
          </article>

          <article class="ui-glass-story__stage ui-glass-story__stage--color">
            <div class="ui-glass-floating ui-glass-story__card">
              <p class="ui-foundation-demo__label">Floating · standard</p>
              <h2>Transient surface</h2>
              <p>菜单、提示与悬浮操作使用标准背景滤镜。</p>
            </div>
          </article>

          <article class="ui-glass-story__stage ui-glass-story__stage--media">
            <div class="ui-glass-overlay ui-glass-story__card">
              <p class="ui-foundation-demo__label">Overlay · standard</p>
              <h2>Media overlay</h2>
              <p>媒体上方使用稳定的深色前景语义。</p>
            </div>
          </article>

          <article class="ui-glass-story__stage ui-glass-story__stage--panel">
            <div class="ui-glass-panel ui-glass-story__card ui-glass-story__card--panel">
              <div>
                <p class="ui-foundation-demo__label">Panel · strong</p>
                <h2>Structural overlay</h2>
                <p>大型侧栏、Sheet 与 Dialog 外壳使用较强材质。</p>
              </div>
              <div class="ui-glass-surface ui-glass-story__panel-content">Caller-owned content</div>
            </div>
          </article>
        </section>
      </main>
    `,
  }),
})

export const FilterOwnership = meta.story({
  name: '单层滤镜',
  render: () => ({
    components: { Button, Pill },
    template: `
      <main class="ui-foundation-demo ui-glass-story">
        <header class="ui-foundation-demo__intro">
          <p class="ui-foundation-demo__eyebrow">Glass continuity</p>
          <h1 class="ui-foundation-demo__title">One region, one filter owner</h1>
          <p class="ui-foundation-demo__copy">外层 Floating 材质拥有背景滤镜；内部组件只消费材质变量，不重复模糊背景。</p>
        </header>

        <section aria-label="Glass filter ownership" class="ui-glass-story__ownership">
          <article class="ui-glass-floating ui-glass-story__owner" data-ui-glass-filter-owner>
            <div>
              <p class="ui-foundation-demo__label">Filter owner</p>
              <h2>Continuous floating surface</h2>
              <p>状态切换应保留这一承载表面，只更新内容与几何。</p>
            </div>
            <div class="ui-glass-story__controls">
              <Pill as="div" variant="glass-surface" data-ui-glass-nested-pill>
                Nested status
              </Pill>
              <Button variant="glass-inset" data-ui-glass-nested-button>
                Nested action
              </Button>
            </div>
          </article>
        </section>
      </main>
    `,
  }),
})

FilterOwnership.test('keeps the carrying surface as the only backdrop-filter owner', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const owner = canvasElement.querySelector<HTMLElement>('[data-ui-glass-filter-owner]')
  const pill = canvasElement.querySelector<HTMLElement>('[data-ui-glass-nested-pill]')
  const button = canvas.getByRole('button', { name: 'Nested action' })

  if (!owner || !pill)
    throw new Error('Glass filter ownership story did not render its public surfaces')

  await expect(getComputedStyle(owner).backdropFilter).not.toBe('none')
  await expect(getComputedStyle(pill).backdropFilter).toBe('none')
  await expect(getComputedStyle(button).backdropFilter).toBe('none')
})

export const SemanticTones = meta.story({
  name: '语义色材质',
  render: () => ({
    template: `
      <main class="ui-foundation-demo ui-glass-story">
        <header class="ui-foundation-demo__intro">
          <p class="ui-foundation-demo__eyebrow">Glass · semantic tones</p>
          <h1 class="ui-foundation-demo__title">Semantic feedback remains legible</h1>
          <p class="ui-foundation-demo__copy">Floating Glass 可以承载 daisyUI 反馈语义，同时保留对应的内容色。</p>
        </header>

        <section aria-label="Semantic Glass tones" class="ui-glass-story__tones">
          <article class="alert alert-info ui-glass-floating" data-ui-glass-tone="info">
            <span><strong>Info</strong> · Supplemental context is available.</span>
          </article>
          <article class="alert alert-success ui-glass-floating" data-ui-glass-tone="success">
            <span><strong>Success</strong> · The operation completed.</span>
          </article>
          <article class="alert alert-warning ui-glass-floating" data-ui-glass-tone="warning">
            <span><strong>Warning</strong> · Review before continuing.</span>
          </article>
        </section>

        <div aria-hidden="true" hidden>
          <span class="text-info-content" data-ui-glass-reference="info" />
          <span class="text-success-content" data-ui-glass-reference="success" />
          <span class="text-warning-content" data-ui-glass-reference="warning" />
        </div>
      </main>
    `,
  }),
})

SemanticTones.test('preserves semantic content tones on filtered surfaces', async ({ canvasElement }) => {
  const tones = ['info', 'success', 'warning'] as const

  await Promise.all(tones.map(async (tone) => {
    const surface = canvasElement.querySelector<HTMLElement>(`[data-ui-glass-tone="${tone}"]`)
    const reference = canvasElement.querySelector<HTMLElement>(`[data-ui-glass-reference="${tone}"]`)

    if (!surface || !reference)
      throw new Error(`Glass semantic tone story did not render ${tone}`)

    await expect(getComputedStyle(surface).backdropFilter).not.toBe('none')
    await expect(getComputedStyle(surface).color).toBe(getComputedStyle(reference).color)
  }))
})
