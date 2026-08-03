import { Button } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../.storybook/preview'

const motions = [
  {
    name: 'standard',
    label: 'Standard',
    detail: '颜色、透明度与轻量状态变化',
    token: 'var(--ui-ease-standard)',
  },
  {
    name: 'enter',
    label: 'Enter',
    detail: '元素出现或进入后的自然减速',
    token: 'var(--ui-ease-enter)',
  },
  {
    name: 'exit',
    label: 'Exit',
    detail: '元素离开或消失前的持续加速',
    token: 'var(--ui-ease-exit)',
  },
  {
    name: 'move',
    label: 'Move',
    detail: '位置、尺寸与布局的结构性几何变化',
    token: 'var(--ui-ease-move)',
  },
  {
    name: 'settle',
    label: 'Settle',
    detail: '进度或跟随值快速抵达稳定终点',
    token: 'var(--ui-ease-settle)',
  },
  {
    name: 'snap',
    label: 'Snap',
    detail: '吸附落位时允许轻微越界回弹',
    token: 'var(--ui-ease-snap)',
  },
  {
    name: 'linear',
    label: 'Linear',
    detail: '滚动时间线、旋转与连续匀速过程',
    token: 'var(--ui-ease-linear)',
  },
] as const

function fixture() {
  const active = ref(false)
  const toggle = () => active.value = !active.value

  return { active, toggle }
}

const meta = preview.meta({
  title: 'Foundations/Motion',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Motion Token 是由 `--ui-ease-*` 暴露的语义 timing-function 词汇，用于按状态变化、进入、退出、结构移动、收敛、吸附或匀速等交互意图选择曲线。持续时间、延迟和编排仍由使用场景决定；不要依赖数学曲线族或硬编码 cubic-bezier，并在减少动态效果时移除路径插值但保留最终结果。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Comparison = meta.story({
  name: '语义曲线对比',
  parameters: {
    docs: {
      description: {
        story: '回答相同距离与时长下，各语义 Motion Token 的节奏有何不同。父 Canvas 保持在起点，只有用户操作或附着测试会触发移动。',
      },
    },
  },
  render: () => ({
    components: { Button },
    setup: () => ({ ...fixture(), motions }),
    template: `
      <main
        aria-labelledby="ui-motion-comparison-title"
        class="min-h-screen bg-base-100 p-[clamp(1rem,4vw,2rem)] text-base-content"
      >
        <div class="mx-auto grid w-full max-w-6xl gap-6">
        <header class="flex flex-wrap items-end justify-between gap-6 rounded-box border border-base-300 bg-base-200 p-[clamp(1.25rem,4vw,1.75rem)] max-md:items-stretch">
          <div class="min-w-[min(100%,18rem)]">
            <p class="m-0 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">Foundations · Motion</p>
            <h1 id="ui-motion-comparison-title" class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">语义曲线对比</h1>
            <p class="m-0 mt-3 max-w-2xl leading-[1.6] text-base-content/75">所有轨道使用相同距离与 800ms 时长，仅 timing function 不同。</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 max-md:items-stretch">
            <Button
              :aria-pressed="active"
              color="primary"
              @click="toggle"
            >
              {{ active ? '返回起点' : '移至终点' }}
            </Button>
            <span class="inline-flex min-h-10 items-center gap-1.5 rounded-field border border-base-300 bg-base-100 px-3 text-[0.8125rem] text-base-content/75">
              当前位置
              <output class="font-bold tabular-nums text-base-content"
                aria-label="曲线对比当前位置"
                aria-live="polite"
                data-ui-motion-position
              >
                {{ active ? '终点' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <ul class="m-0 grid list-none gap-3 p-0" aria-label="Motion Token 语义列表">
          <li
            v-for="motion in motions"
            :key="motion.name"
            class="grid grid-cols-[minmax(12rem,0.75fr)_minmax(16rem,1.25fr)] items-center gap-6 rounded-box border border-base-300 bg-base-100 p-4 max-md:grid-cols-1 max-md:gap-4"
            :style="{ '--ui-motion-ease': motion.token }"
          >
            <div class="grid min-w-0 grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-1">
              <strong class="text-base">{{ motion.label }}</strong>
              <code class="w-fit justify-self-start rounded-field border border-base-300 bg-base-200 px-1.5 py-0.5 text-xs font-semibold text-base-content">--ui-ease-{{ motion.name }}</code>
              <span class="col-span-2 text-[0.8125rem] leading-6 text-base-content/70">{{ motion.detail }}</span>
            </div>
            <div class="relative h-14 rounded-full bg-base-200 shadow-[inset_0_0_0_var(--border)_var(--color-base-300)]" aria-hidden="true">
              <span class="absolute inset-y-1.5 start-1.5 w-11 rounded-full border border-dashed border-primary/60" />
              <span class="absolute inset-y-1.5 end-1.5 w-11 rounded-full border border-dashed border-primary/60" />
              <span
                class="absolute start-1.5 top-1.5 grid size-11 place-items-center rounded-full bg-primary font-extrabold text-primary-content shadow-[0_0.5rem_1.25rem_color-mix(in_oklab,var(--color-primary)_30%,transparent)] transition-[inset-inline-start] duration-800 motion-reduce:duration-0 [transition-timing-function:var(--ui-motion-ease)]"
                :class="{ 'start-[calc(100%-3.125rem)]': active }"
              >{{ motion.name.slice(0, 1).toUpperCase() }}</span>
            </div>
          </li>
        </ul>
        </div>
      </main>
    `,
  }),
})

Comparison.test('compares every semantic curve from an inert starting point', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const control = canvas.getByRole('button', { name: '移至终点' })
  const position = canvas.getByLabelText('曲线对比当前位置')

  await expect(canvas.getAllByRole('listitem')).toHaveLength(motions.length)
  await expect(control).toHaveAttribute('aria-pressed', 'false')
  await expect(position).toHaveTextContent('起点')

  control.focus()
  await expect(control).toHaveFocus()
  await userEvent.keyboard('{Enter}')

  await expect(control).toHaveAttribute('aria-pressed', 'true')
  await expect(control).toHaveAccessibleName('返回起点')
  await expect(position).toHaveTextContent('终点')
})

export const MagneticSnap = meta.story({
  name: '磁贴吸附',
  parameters: {
    docs: {
      description: {
        story: '回答何时使用 Snap：它只适合允许轻微越界回弹的吸附落位；普通位置或布局变化应使用 Move。',
      },
    },
  },
  render: () => ({
    components: { Button },
    setup: fixture,
    template: `
      <main
        aria-labelledby="ui-motion-snap-title"
        class="min-h-screen bg-base-100 p-[clamp(1rem,4vw,2rem)] text-base-content"
      >
        <div class="mx-auto grid w-full max-w-6xl gap-6">
        <header class="flex flex-wrap items-end justify-between gap-6 rounded-box border border-base-300 bg-base-200 p-[clamp(1.25rem,4vw,1.75rem)] max-md:items-stretch">
          <div class="min-w-[min(100%,18rem)]">
            <p class="m-0 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">--ui-ease-snap</p>
            <h1 id="ui-motion-snap-title" class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">磁贴吸附</h1>
            <p class="m-0 mt-3 max-w-2xl leading-[1.6] text-base-content/75">磁贴接近目标后略微越界，再回落到唯一的吸附位置。</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 max-md:items-stretch">
            <Button
              :aria-pressed="active"
              color="primary"
              @click="toggle"
            >
              {{ active ? '返回起点' : '吸附到目标' }}
            </Button>
            <span class="inline-flex min-h-10 items-center gap-1.5 rounded-field border border-base-300 bg-base-100 px-3 text-[0.8125rem] text-base-content/75">
              当前位置
              <output class="font-bold tabular-nums text-base-content"
                aria-label="磁贴当前位置"
                aria-live="polite"
                data-ui-motion-snap-position
              >
                {{ active ? '吸附目标' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <section class="relative min-h-[22rem] overflow-hidden rounded-box border border-base-300 bg-linear-to-br from-primary/10 to-secondary/10 shadow-[inset_0_0_3rem_color-mix(in_oklab,var(--color-primary)_8%,transparent)] max-md:min-h-72" aria-label="吸附演示区域">
          <div class="absolute start-8 top-1/2 grid size-32 -translate-y-1/2 place-items-end justify-center rounded-box border-2 border-dashed border-primary/60 bg-primary/10 pb-3 text-xs font-bold text-base-content/70 max-md:start-4 max-md:size-22">
            <span>起点</span>
          </div>
          <div class="absolute end-8 top-1/2 grid size-32 -translate-y-1/2 place-items-end justify-center rounded-box border-2 border-dashed border-primary/60 bg-primary/10 pb-3 text-xs font-bold text-base-content/70 max-md:end-4 max-md:size-22">
            <span>吸附目标</span>
          </div>
          <div
            class="absolute start-10 top-1/2 grid size-28 -translate-y-1/2 place-items-center rounded-box border border-white/35 bg-linear-to-br from-primary to-secondary text-2xl font-black text-primary-content shadow-[0_1.25rem_3rem_color-mix(in_oklab,var(--color-primary)_28%,transparent),inset_0_1px_0_color-mix(in_oklab,white_42%,transparent)] transition-[inset-inline-start] duration-560 motion-reduce:duration-0 [transition-timing-function:var(--ui-ease-snap)] max-md:start-[1.375rem] max-md:size-19 max-md:text-base"
            :class="{ 'start-[calc(100%-9.5rem)] max-md:start-[calc(100%-6.125rem)]': active }"
            aria-hidden="true"
          >
            <span>115</span>
          </div>
        </section>
        </div>
      </main>
    `,
  }),
})

MagneticSnap.test('settles at the magnetic target after an explicit action', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const control = canvas.getByRole('button', { name: '吸附到目标' })
  const position = canvas.getByLabelText('磁贴当前位置')

  await expect(control).toHaveAttribute('aria-pressed', 'false')
  await expect(position).toHaveTextContent('起点')

  await userEvent.click(control)

  await expect(control).toHaveAttribute('aria-pressed', 'true')
  await expect(control).toHaveAccessibleName('返回起点')
  await expect(position).toHaveTextContent('吸附目标')
})

export const ReducedMotion = meta.story({
  name: '减少动态效果',
  parameters: {
    docs: {
      description: {
        story: '回答减少动态效果时保留什么：路径插值立即完成，但触发方式、最终位置与可读状态反馈保持不变。Storybook reduced-motion 项目会渲染并验证降级分支。',
      },
    },
  },
  render: () => ({
    components: { Button },
    setup() {
      return {
        ...fixture(),
        reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      }
    },
    template: `
      <main
        aria-labelledby="ui-motion-reduced-title"
        class="min-h-screen bg-base-100 p-[clamp(1rem,4vw,2rem)] text-base-content"
      >
        <div class="mx-auto grid w-full max-w-6xl gap-6">
        <header class="flex flex-wrap items-end justify-between gap-6 rounded-box border border-base-300 bg-base-200 p-[clamp(1.25rem,4vw,1.75rem)] max-md:items-stretch">
          <div class="min-w-[min(100%,18rem)]">
            <p class="m-0 mb-2 text-xs font-bold uppercase tracking-[0.08em] text-base-content/70">prefers-reduced-motion</p>
            <h1 id="ui-motion-reduced-title" class="m-0 text-[clamp(1.75rem,5vw,3rem)] leading-none">减少动态效果</h1>
            <p class="m-0 mt-3 max-w-2xl leading-[1.6] text-base-content/75">偏好只改变抵达终点的路径，不改变操作及其结果。</p>
          </div>
          <div class="flex flex-wrap items-center gap-3 max-md:items-stretch">
            <span class="inline-flex min-h-10 items-center gap-1.5 rounded-field border border-primary/35 bg-primary/10 px-3 text-[0.8125rem] text-base-content/75">
              当前偏好
              <output class="font-bold tabular-nums text-base-content" aria-label="当前动态效果偏好" data-ui-motion-preference>
                {{ reduced ? '减少动态效果' : '完整动态效果' }}
              </output>
            </span>
            <Button
              :aria-pressed="active"
              color="primary"
              @click="toggle"
            >
              {{ active ? '返回起点' : '移至终点' }}
            </Button>
            <span class="inline-flex min-h-10 items-center gap-1.5 rounded-field border border-base-300 bg-base-100 px-3 text-[0.8125rem] text-base-content/75">
              当前位置
              <output class="font-bold tabular-nums text-base-content"
                aria-label="降级演示当前位置"
                aria-live="polite"
                data-ui-motion-reduced-position
              >
                {{ active ? '终点' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <section class="grid gap-4 rounded-box border border-base-300 bg-base-100 p-[clamp(1.25rem,5vw,3rem)] max-md:p-4" aria-label="动态效果降级演示">
          <div class="relative h-20 rounded-full bg-base-200 shadow-[inset_0_0_0_var(--border)_var(--color-base-300)]" aria-hidden="true">
            <span class="absolute inset-y-2.5 start-2.5 w-15 rounded-full border border-dashed border-primary/60" />
            <span class="absolute inset-y-2.5 end-2.5 w-15 rounded-full border border-dashed border-primary/60" />
            <span
              class="absolute start-2.5 top-2.5 grid size-15 place-items-center rounded-full bg-neutral text-sm font-extrabold text-neutral-content transition-[inset-inline-start] duration-640 motion-reduce:duration-0 [transition-timing-function:var(--ui-ease-move)]"
              :class="{ 'start-[calc(100%-4.375rem)]': active }"
              data-ui-motion-reduced-tile
            >115</span>
          </div>
          <p class="m-0 text-center text-sm leading-6 text-base-content/75">完整动态效果使用 Move 完成结构位移；减少动态效果时直接呈现相同终点。</p>
        </section>
        </div>
      </main>
    `,
  }),
})

ReducedMotion.test('preserves the outcome while removing reduced-motion interpolation', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const control = canvas.getByRole('button', { name: '移至终点' })
  const position = canvas.getByLabelText('降级演示当前位置')
  const preference = canvas.getByLabelText('当前动态效果偏好')
  const tile = canvasElement.querySelector<HTMLElement>('[data-ui-motion-reduced-tile]')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!tile)
    throw new Error('Reduced motion story did not render its moving tile')

  await expect(preference).toHaveTextContent(reduced ? '减少动态效果' : '完整动态效果')
  await expect(position).toHaveTextContent('起点')

  const duration = getComputedStyle(tile).transitionDuration

  await userEvent.click(control)
  await expect(position).toHaveTextContent('终点')
  await expect(control).toHaveAttribute('aria-pressed', 'true')

  if (reduced) {
    await expect(duration).toBe('0s')
    return
  }

  await expect(duration).not.toBe('0s')
})
