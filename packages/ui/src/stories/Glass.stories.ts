import { Button, Pill } from '@115master/ui'
import { expect, within } from 'storybook/test'
import preview from '../../.storybook/preview'

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
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-md:p-4">
        <div class="mx-auto grid max-w-6xl gap-6">
        <header class="grid gap-4 rounded-box bg-base-200 p-6">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Foundations · Glass</p>
          <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">Materials by carrying context</h1>
          <p class="m-0">每种材质都在其真实承载背景中展示；名称表达场景，不表达透明度数值。</p>
        </header>

        <section aria-label="Glass materials" class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <article class="grid min-h-60 rounded-box bg-linear-to-br from-primary/10 to-base-200 p-5">
            <div class="ui-glass-surface grid min-h-full content-start gap-3 rounded-box p-5">
              <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-inherit">Surface · no filter</p>
              <h2 class="m-0">Supporting surface</h2>
              <p class="m-0">面板内部的弱层次，不创建新的合成层。</p>
            </div>
          </article>

          <article class="grid min-h-60 rounded-box bg-linear-to-br from-primary/10 to-base-200 p-5">
            <div class="ui-glass-inset grid min-h-full content-start gap-3 rounded-box p-5">
              <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-inherit">Inset · no filter</p>
              <h2 class="m-0">Selected information</h2>
              <p class="m-0">浮层内部的选中区域，维持单层滤镜。</p>
            </div>
          </article>

          <article class="grid min-h-60 rounded-box bg-linear-to-br from-primary/50 via-secondary/25 to-accent/40 p-5">
            <div class="ui-glass-floating grid min-h-full content-start gap-3 rounded-box p-5">
              <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-inherit">Floating · standard</p>
              <h2 class="m-0">Transient surface</h2>
              <p class="m-0">菜单、提示与悬浮操作使用标准背景滤镜。</p>
            </div>
          </article>

          <article class="grid min-h-60 items-end rounded-box bg-linear-to-br from-primary via-secondary to-neutral p-5">
            <div class="ui-glass-overlay grid content-start gap-3 rounded-box p-5">
              <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-inherit">Overlay · standard</p>
              <h2 class="m-0">Media overlay</h2>
              <p class="m-0">媒体上方使用稳定的深色前景语义。</p>
            </div>
          </article>

          <article class="grid min-h-60 rounded-box bg-linear-to-br from-accent/30 via-base-200 to-primary/30 p-5 md:col-span-2">
            <div class="ui-glass-panel grid min-h-full content-start gap-3 rounded-box p-5 md:grid-cols-[minmax(0,1fr)_minmax(12rem,0.65fr)] md:items-center">
              <div>
                <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-inherit">Panel · strong</p>
                <h2 class="m-0">Structural overlay</h2>
                <p class="m-0">大型侧栏、Sheet 与 Dialog 外壳使用较强材质。</p>
              </div>
              <div class="ui-glass-surface rounded-field p-4">Caller-owned content</div>
            </div>
          </article>
        </section>
        </div>
      </main>
    `,
  }),
})

export const Contrast = meta.story({
  name: '极端背景对比',
  render: () => ({
    template: `
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-md:p-4">
        <div class="mx-auto grid max-w-6xl gap-6">
          <header class="grid gap-4 rounded-box bg-base-200 p-6">
            <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Floating Glass · contrast</p>
            <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">One material across background extremes</h1>
            <p class="m-0">Floating 材质通过中性底色稳定前景，不依赖下方内容本身提供对比度。</p>
          </header>

          <section aria-label="Floating Glass background extremes" class="relative grid min-h-72 overflow-hidden rounded-box sm:grid-cols-2">
            <div class="bg-black p-6 text-sm font-semibold text-white/70">Deep backdrop</div>
            <div class="bg-white p-6 text-right text-sm font-semibold text-black/70">Light backdrop</div>
            <article class="ui-glass-floating absolute inset-x-[clamp(1rem,8vw,6rem)] top-1/2 grid -translate-y-1/2 gap-6 rounded-box p-6 sm:grid-cols-2">
              <div>
                <h2 class="m-0">Over deep content</h2>
                <p class="mb-0">The foreground remains distinct from the darkest backdrop.</p>
              </div>
              <div>
                <h2 class="m-0">Over light content</h2>
                <p class="mb-0">The same surface also separates it from the lightest backdrop.</p>
              </div>
            </article>
          </section>
        </div>
      </main>
    `,
  }),
})

export const FilterOwnership = meta.story({
  name: '单层滤镜',
  render: () => ({
    components: { Button, Pill },
    template: `
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-md:p-4">
        <div class="mx-auto grid max-w-6xl gap-6">
        <header class="grid gap-4 rounded-box bg-base-200 p-6">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Glass continuity</p>
          <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">One region, one filter owner</h1>
          <p class="m-0">外层 Floating 材质拥有背景滤镜；内部组件只消费材质变量，不重复模糊背景。</p>
        </header>

        <section aria-label="Glass filter ownership" class="rounded-box bg-linear-to-br from-primary/40 via-base-200 to-accent/35 p-[clamp(1.5rem,6vw,5rem)]">
          <article class="ui-glass-floating grid items-center gap-6 rounded-box p-6 md:grid-cols-[minmax(0,1fr)_auto]" data-ui-glass-filter-owner>
            <div>
              <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Filter owner</p>
              <h2 class="m-0">Continuous floating surface</h2>
              <p class="m-0">状态切换应保留这一承载表面，只更新内容与几何。</p>
            </div>
            <div class="flex flex-wrap gap-3 md:justify-end">
              <Pill as="div" variant="glass-surface" data-ui-glass-nested-pill>
                Nested status
              </Pill>
              <Button variant="glass-inset" data-ui-glass-nested-button>
                Nested action
              </Button>
            </div>
          </article>
        </section>
        </div>
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
      <main class="min-h-screen bg-base-100 p-8 text-base-content max-md:p-4">
        <div class="mx-auto grid max-w-6xl gap-6">
        <header class="grid gap-4 rounded-box bg-base-200 p-6">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Glass · semantic tones</p>
          <h1 class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">Semantic feedback remains legible</h1>
          <p class="m-0">Floating Glass 可以承载 daisyUI 反馈语义，同时保留对应的内容色。</p>
        </header>

        <section aria-label="Semantic Glass tones" class="grid grid-cols-1 gap-4 rounded-box bg-linear-to-br from-primary/30 via-base-200 to-accent/30 p-[clamp(1.5rem,5vw,4rem)] md:grid-cols-2 [&>:last-child:nth-child(odd)]:md:col-span-2">
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
