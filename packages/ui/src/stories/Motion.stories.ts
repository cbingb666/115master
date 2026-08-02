import { Button } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../.storybook/preview'
import './motion.css'

const curves = [
  {
    name: 'standard',
    label: 'Standard',
    detail: '颜色、透明度与轻量状态变化',
    token: 'var(--ui-ease-standard)',
  },
  {
    name: 'enter',
    label: 'Enter',
    detail: '元素进入并自然减速',
    token: 'var(--ui-ease-enter)',
  },
  {
    name: 'exit',
    label: 'Exit',
    detail: '元素退出并持续加速',
    token: 'var(--ui-ease-exit)',
  },
  {
    name: 'move',
    label: 'Move',
    detail: '尺寸、位置与结构性几何变化',
    token: 'var(--ui-ease-move)',
  },
  {
    name: 'settle',
    label: 'Settle',
    detail: '进度与跟随值快速抵达终点',
    token: 'var(--ui-ease-settle)',
  },
  {
    name: 'snap',
    label: 'Snap',
    detail: '吸附落位并轻微越界回弹',
    token: 'var(--ui-ease-snap)',
  },
  {
    name: 'linear',
    label: 'Linear',
    detail: '滚动时间线与连续匀速过程',
    token: 'var(--ui-ease-linear)',
  },
] as const

const meta = preview.meta({
  title: 'Foundations/Motion',
  parameters: {
    docs: {
      description: {
        component: 'Motion Token 按交互意图组织 timing function；调用方选择语义，不依赖数学曲线族或裸 cubic-bezier。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Comparison = meta.story({
  name: '语义曲线对比',
  render: () => ({
    components: { Button },
    setup() {
      const active = ref(false)
      const plays = ref(0)
      const play = () => {
        active.value = !active.value
        plays.value += 1
      }

      return { active, curves, plays, play }
    },
    template: `
      <main
        aria-label="Motion Token 曲线对比"
        class="ui-motion-demo"
        :data-active="active"
      >
        <header class="ui-motion-demo__header">
          <div>
            <p class="ui-motion-demo__eyebrow">Foundations · Motion</p>
            <h1 class="ui-motion-demo__title">语义曲线对比</h1>
            <p class="ui-motion-demo__copy">所有磁贴使用相同距离与 800ms 时长，仅 timing function 不同。</p>
          </div>
          <div class="ui-motion-demo__actions">
            <Button color="primary" @click="play">切换方向</Button>
            <span class="ui-motion-demo__count">
              播放次数
              <output aria-live="polite" data-ui-motion-plays>{{ plays }}</output>
            </span>
          </div>
        </header>

        <section class="ui-motion-demo__list" aria-label="Motion Token 列表">
          <article
            v-for="curve in curves"
            :key="curve.name"
            class="ui-motion-demo__row"
            :style="{ '--ui-motion-ease': curve.token }"
          >
            <div class="ui-motion-demo__meta">
              <strong>{{ curve.label }}</strong>
              <code>--ui-ease-{{ curve.name }}</code>
              <span>{{ curve.detail }}</span>
            </div>
            <div class="ui-motion-demo__rail" aria-hidden="true">
              <span class="ui-motion-demo__well ui-motion-demo__well--start" />
              <span class="ui-motion-demo__well ui-motion-demo__well--end" />
              <span class="ui-motion-demo__tile">{{ curve.name.slice(0, 1).toUpperCase() }}</span>
            </div>
          </article>
        </section>
      </main>
    `,
  }),
})

Comparison.test('plays the semantic motion comparison', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const demo = canvas.getByRole('main', { name: 'Motion Token 曲线对比' })
  const plays = canvasElement.querySelector<HTMLOutputElement>('[data-ui-motion-plays]')

  if (!plays)
    throw new Error('Motion comparison did not render its observable play count')

  await expect(demo).toHaveAttribute('data-active', 'false')
  await expect(plays).toHaveTextContent('0')
  await userEvent.click(canvas.getByRole('button', { name: '切换方向' }))
  await expect(demo).toHaveAttribute('data-active', 'true')
  await expect(plays).toHaveTextContent('1')
})

export const MagneticSnap = meta.story({
  name: '磁贴吸附',
  render: () => ({
    components: { Button },
    setup() {
      const active = ref(false)
      const plays = ref(0)
      const play = () => {
        active.value = !active.value
        plays.value += 1
      }

      return { active, plays, play }
    },
    template: `
      <main
        aria-label="磁贴吸附 Motion Token"
        class="ui-motion-snap"
        :data-active="active"
      >
        <header class="ui-motion-demo__header">
          <div>
            <p class="ui-motion-demo__eyebrow">--ui-ease-snap</p>
            <h1 class="ui-motion-demo__title">磁贴吸附</h1>
            <p class="ui-motion-demo__copy">磁贴接近目标后略微越界，再回落到吸附位置。</p>
          </div>
          <div class="ui-motion-demo__actions">
            <Button color="primary" @click="play">切换吸附位置</Button>
            <span class="ui-motion-demo__count">
              播放次数
              <output aria-live="polite" data-ui-motion-snap-plays>{{ plays }}</output>
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

MagneticSnap.test('plays the magnetic snap example', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const demo = canvas.getByRole('main', { name: '磁贴吸附 Motion Token' })
  const plays = canvasElement.querySelector<HTMLOutputElement>('[data-ui-motion-snap-plays]')

  if (!plays)
    throw new Error('Magnetic snap story did not render its observable play count')

  await expect(demo).toHaveAttribute('data-active', 'false')
  await expect(plays).toHaveTextContent('0')
  await userEvent.click(canvas.getByRole('button', { name: '切换吸附位置' }))
  await expect(demo).toHaveAttribute('data-active', 'true')
  await expect(plays).toHaveTextContent('1')
})
