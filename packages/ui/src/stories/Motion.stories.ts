import { Button } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../.storybook/preview'
import './motion.css'

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
        class="ui-motion-demo"
        :data-ui-motion-active="active"
      >
        <header class="ui-motion-demo__header">
          <div>
            <p class="ui-motion-demo__eyebrow">Foundations · Motion</p>
            <h1 id="ui-motion-comparison-title" class="ui-motion-demo__title">语义曲线对比</h1>
            <p class="ui-motion-demo__copy">所有轨道使用相同距离与 800ms 时长，仅 timing function 不同。</p>
          </div>
          <div class="ui-motion-demo__actions">
            <Button
              :aria-pressed="active"
              color="primary"
              @click="toggle"
            >
              {{ active ? '返回起点' : '移至终点' }}
            </Button>
            <span class="ui-motion-demo__status">
              当前位置
              <output
                aria-label="曲线对比当前位置"
                aria-live="polite"
                data-ui-motion-position
              >
                {{ active ? '终点' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <ul class="ui-motion-demo__list" aria-label="Motion Token 语义列表">
          <li
            v-for="motion in motions"
            :key="motion.name"
            class="ui-motion-demo__row"
            :style="{ '--ui-motion-ease': motion.token }"
          >
            <div class="ui-motion-demo__meta">
              <strong>{{ motion.label }}</strong>
              <code>--ui-ease-{{ motion.name }}</code>
              <span>{{ motion.detail }}</span>
            </div>
            <div class="ui-motion-demo__rail" aria-hidden="true">
              <span class="ui-motion-demo__well ui-motion-demo__well--start" />
              <span class="ui-motion-demo__well ui-motion-demo__well--end" />
              <span class="ui-motion-demo__tile">{{ motion.name.slice(0, 1).toUpperCase() }}</span>
            </div>
          </li>
        </ul>
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
        class="ui-motion-snap"
        :data-ui-motion-active="active"
      >
        <header class="ui-motion-demo__header">
          <div>
            <p class="ui-motion-demo__eyebrow">--ui-ease-snap</p>
            <h1 id="ui-motion-snap-title" class="ui-motion-demo__title">磁贴吸附</h1>
            <p class="ui-motion-demo__copy">磁贴接近目标后略微越界，再回落到唯一的吸附位置。</p>
          </div>
          <div class="ui-motion-demo__actions">
            <Button
              :aria-pressed="active"
              color="primary"
              @click="toggle"
            >
              {{ active ? '返回起点' : '吸附到目标' }}
            </Button>
            <span class="ui-motion-demo__status">
              当前位置
              <output
                aria-label="磁贴当前位置"
                aria-live="polite"
                data-ui-motion-snap-position
              >
                {{ active ? '吸附目标' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <section class="ui-motion-snap__stage" aria-label="吸附演示区域">
          <div class="ui-motion-snap__target ui-motion-snap__target--start">
            <span>起点</span>
          </div>
          <div class="ui-motion-snap__target ui-motion-snap__target--end">
            <span>吸附目标</span>
          </div>
          <div class="ui-motion-snap__tile" aria-hidden="true">
            <span>115</span>
          </div>
        </section>
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
        class="ui-motion-reduced"
        :data-ui-motion-active="active"
      >
        <header class="ui-motion-demo__header">
          <div>
            <p class="ui-motion-demo__eyebrow">prefers-reduced-motion</p>
            <h1 id="ui-motion-reduced-title" class="ui-motion-demo__title">减少动态效果</h1>
            <p class="ui-motion-demo__copy">偏好只改变抵达终点的路径，不改变操作及其结果。</p>
          </div>
          <div class="ui-motion-demo__actions">
            <span class="ui-motion-demo__preference">
              当前偏好
              <output aria-label="当前动态效果偏好" data-ui-motion-preference>
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
            <span class="ui-motion-demo__status">
              当前位置
              <output
                aria-label="降级演示当前位置"
                aria-live="polite"
                data-ui-motion-reduced-position
              >
                {{ active ? '终点' : '起点' }}
              </output>
            </span>
          </div>
        </header>

        <section class="ui-motion-reduced__stage" aria-label="动态效果降级演示">
          <div class="ui-motion-reduced__rail" aria-hidden="true">
            <span class="ui-motion-reduced__well ui-motion-reduced__well--start" />
            <span class="ui-motion-reduced__well ui-motion-reduced__well--end" />
            <span class="ui-motion-reduced__tile" data-ui-motion-reduced-tile>115</span>
          </div>
          <p class="ui-motion-reduced__note">完整动态效果使用 Move 完成结构位移；减少动态效果时直接呈现相同终点。</p>
        </section>
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
