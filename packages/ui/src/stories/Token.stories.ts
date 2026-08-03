import { expect, waitFor, within } from 'storybook/test'
import { onMounted, ref } from 'vue'
import preview from '../../.storybook/preview'

const groups = [
  {
    id: 'component',
    name: '组件内',
    description: '在单个组件的隔离边界内安排衬底、抬升内容与覆盖层。',
    layers: [
      { id: 'under', token: '--ui-z-under', utility: 'ui-z-under', role: '衬底伪元素' },
      { id: 'raised', token: '--ui-z-raised', utility: 'ui-z-raised', role: '组件内抬升' },
      { id: 'cover', token: '--ui-z-cover', utility: 'ui-z-cover', role: '组件内全覆盖' },
    ],
  },
  {
    id: 'page',
    name: '页面',
    description: '按页面职责排列固定内容、局部浮层、遮罩与抽屉。',
    layers: [
      { id: 'elevated', token: '--ui-z-elevated', utility: 'ui-z-elevated', role: '页面浮动条' },
      { id: 'dropdown', token: '--ui-z-dropdown', utility: 'ui-z-dropdown', role: '局部下拉浮层' },
      { id: 'header', token: '--ui-z-header', utility: 'ui-z-header', role: '页面吸附头部' },
      { id: 'fab', token: '--ui-z-fab', utility: 'ui-z-fab', role: '浮动操作按钮' },
      { id: 'scrim', token: '--ui-z-scrim', utility: 'ui-z-scrim', role: '页面遮罩' },
      { id: 'sheet', token: '--ui-z-sheet', utility: 'ui-z-sheet', role: '页面抽屉' },
    ],
  },
  {
    id: 'global',
    name: '全局',
    description: '跨页面边界排序宿主内容与浮层；进度有意低于交互浮层。',
    layers: [
      { id: 'host', token: '--ui-z-host', utility: 'ui-z-host', role: '宿主注入边界' },
      { id: 'progress', token: '--ui-z-progress', utility: 'ui-z-progress', role: '全局进度条' },
      { id: 'menu', token: '--ui-z-menu', utility: 'ui-z-menu', role: '全局菜单' },
      { id: 'toast', token: '--ui-z-toast', utility: 'ui-z-toast', role: '全局通知' },
      { id: 'tooltip', token: '--ui-z-tooltip', utility: 'ui-z-tooltip', role: '全局提示' },
      { id: 'dnd', token: '--ui-z-dnd', utility: 'ui-z-dnd', role: '拖拽幽灵层' },
      { id: 'watermark', token: '--ui-z-watermark', utility: 'ui-z-watermark', role: '非交互水印' },
    ],
  },
]

const meta = preview.meta({
  title: 'Foundations/Token',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Design Token 为 Theme、组件与材质共享的视觉决策提供稳定语义；已有颜色、圆角和尺寸概念直接使用 daisyUI Token，UI 命名空间只补充其缺失的跨组件概念。它不是魔法数清单，也不为 daisyUI 语义创建重复别名。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const LayeringScale = meta.story({
  name: '层叠尺度',
  parameters: {
    docs: {
      description: {
        story:
          '按组件内、页面与全局三段展示每个 `--ui-z-*` Token 及其同名 `ui-z-*` utility；Dialog 使用原生 top layer，不参与这套普通文档层级。',
      },
    },
  },
  render: () => ({
    setup() {
      const root = ref<HTMLElement>()
      const values = ref<Record<string, string>>({})

      onMounted(() => {
        if (!root.value)
          return

        const style = getComputedStyle(root.value)
        values.value = Object.fromEntries(groups.flatMap(group => group.layers).map(layer => [
          layer.id,
          style.getPropertyValue(layer.token).trim(),
        ]))
      })

      return { groups, root, values }
    },
    template: `
      <main ref="root" class="min-h-screen bg-[radial-gradient(circle_at_8%_0%,color-mix(in_oklab,var(--color-primary)_13%,transparent),transparent_28rem),var(--color-base-100)] p-[clamp(1.25rem,4vw,3rem)] text-base-content" aria-label="Design Token 层叠尺度">
        <header class="mx-auto mb-8 grid max-w-7xl gap-3 min-[76rem]:pl-0">
          <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-primary">@115master/ui · Design Token</p>
          <h1 class="m-0 text-[clamp(2rem,7vw,4.5rem)] leading-[0.95] tracking-[-0.04em]">层叠尺度</h1>
          <p class="m-0 max-w-3xl text-[1.05rem] leading-[1.7]">
            颜色、圆角与尺寸沿用 daisyUI；UI Token 只为缺失的全局层叠角色补充稳定名称。
          </p>
          <p class="m-0 w-fit rounded-field border border-base-content/15 bg-base-200 px-3.5 py-2.5 text-sm text-base-content/70">
            使用语义角色而非裸 z-index。原生 Dialog 位于 top layer，不占用这里的数值。
          </p>
        </header>

        <div class="mx-auto grid max-w-7xl items-start gap-4 md:grid-cols-2 min-[72rem]:grid-cols-[0.8fr_1.1fr_1.2fr] md:[&>:last-child]:col-span-2 min-[72rem]:[&>:last-child]:col-span-1">
          <section
            v-for="group in groups"
            :key="group.id"
            :aria-labelledby="'ui-token-group-' + group.id"
            class="min-w-0 rounded-box border border-base-content/10 bg-base-200/90 p-4"
          >
            <header class="grid gap-1.5 px-1.5 pb-4 pt-1.5">
              <p class="m-0 text-xs font-bold uppercase tracking-[0.1em] text-base-content/80">{{ group.name }}</p>
              <h2 class="m-0 text-xl" :id="'ui-token-group-' + group.id">{{ group.name }}层级</h2>
              <p class="m-0 min-h-[3em] text-sm leading-6 text-base-content/65">{{ group.description }}</p>
            </header>

            <ol class="m-0 list-none p-0">
              <li
                v-for="layer in group.layers"
                :key="layer.id"
                :class="layer.utility"
                :data-ui-token="layer.id"
                class="mb-2 grid break-inside-avoid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-field border border-base-content/10 bg-base-100 p-3 last:mb-0 max-[32rem]:grid-cols-1"
              >
                <div class="grid min-w-0 gap-1">
                  <strong class="text-sm">{{ layer.role }}</strong>
                  <code class="[overflow-wrap:anywhere] text-[0.7rem] text-base-content/70">{{ layer.token }}</code>
                </div>
                <div class="grid min-w-0 justify-items-end gap-1 max-[32rem]:grid-cols-[minmax(0,1fr)_auto] max-[32rem]:items-center max-[32rem]:justify-items-start">
                  <code class="[overflow-wrap:anywhere] text-[0.7rem] text-base-content/70">.{{ layer.utility }}</code>
                  <span class="grid min-h-8 min-w-14 place-items-center rounded-selector bg-base-300 px-2 font-bold tabular-nums text-base-content" data-ui-token-value>{{ values[layer.id] }}</span>
                </div>
              </li>
            </ol>
          </section>
        </div>
      </main>
    `,
  }),
})

LayeringScale.test('proves Token utility pairs and semantic stacking order', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const scale = canvas.getByRole('main', { name: 'Design Token 层叠尺度' })
  const layers = groups.flatMap(group => group.layers)
  const records = layers.map((layer) => {
    const item = scale.querySelector<HTMLElement>(`[data-ui-token="${layer.id}"]`)
    const value = item?.querySelector<HTMLElement>('[data-ui-token-value]')

    if (!item || !value)
      throw new Error(`Token story did not render the ${layer.id} layer`)

    return {
      item,
      layer,
      token: Number(getComputedStyle(scale).getPropertyValue(layer.token)),
      utility: Number(getComputedStyle(item).zIndex),
      value,
    }
  })

  await waitFor(() => expect(records.every(record => record.value.textContent?.trim())).toBe(true))
  await expect(records.every(record => Number.isFinite(record.token))).toBe(true)

  await Promise.all(records.map(async (record) => {
    await expect(record.utility).toBe(record.token)
    await expect(Number(record.value.textContent)).toBe(record.token)
  }))

  await Promise.all(groups.map(async (group) => {
    const values = records
      .filter(record => group.layers.some(layer => layer.id === record.layer.id))
      .map(record => record.token)

    await expect(values.every((value, index) => index === 0 || value > values[index - 1]!)).toBe(true)
  }))

  const progress = records.find(record => record.layer.id === 'progress')
  const menu = records.find(record => record.layer.id === 'menu')
  const dnd = records.find(record => record.layer.id === 'dnd')
  const watermark = records.find(record => record.layer.id === 'watermark')

  if (!progress || !menu || !dnd || !watermark)
    throw new Error('Token story did not render the global layering invariants')

  await expect(progress.token).toBeLessThan(menu.token)
  await expect(watermark.token).toBeGreaterThan(dnd.token)
})
