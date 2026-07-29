import { OverlayHost, Tooltip } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    docs: {
      description: {
        component: '非交互补充说明。定位、碰撞处理、ARIA 关联与当前 Theme 范围内的 Teleport 都由公共契约负责。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Interaction = meta.story({
  name: '延迟、键盘与 ARIA',
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <div class="flex min-h-80 items-center justify-center gap-3 p-8">
          <Tooltip content="通过悬停或键盘焦点查看说明">
            <button class="btn" type="button">说明触发器</button>
          </Tooltip>
          <button class="btn" type="button">下一个控件</button>
        </div>
      </OverlayHost>
    `,
  }),
})

Interaction.test('proves pointer, keyboard, and ARIA behavior', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '说明触发器' })

  await userEvent.hover(trigger)
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  await waitFor(async () => {
    await expect(canvas.getByRole('tooltip')).toBeVisible()
  })

  await userEvent.unhover(trigger)
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  await userEvent.tab()
  const tooltip = canvas.getByRole('tooltip')
  await expect(trigger).toHaveFocus()
  await expect(tooltip).toHaveAttribute('role', 'tooltip')
  await expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)

  await userEvent.tab()
  await expect(canvas.getByRole('button', { name: '下一个控件' })).toHaveFocus()
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })
  await expect(trigger).not.toHaveAttribute('aria-describedby')

  await userEvent.tab({ shift: true })
  await expect(trigger).toHaveFocus()
  await expect(canvas.getByRole('tooltip')).toBeVisible()
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

export const ContentSlotsAndEmptyContent = meta.story({
  name: '内容 slot 与空内容',
  render: () => ({
    components: { OverlayHost, Tooltip },
    setup() {
      const empty = ref(false)

      return { empty }
    },
    template: `
      <OverlayHost>
        <div class="flex min-h-80 items-center justify-center gap-3 p-8">
          <Tooltip>
            <template #default>
              <button class="btn" type="button">slot 内容</button>
            </template>
            <template #content>
              <span>由 content slot 提供的说明</span>
            </template>
          </Tooltip>
          <Tooltip>
            <button class="btn" type="button">空内容</button>
          </Tooltip>
          <Tooltip>
            <template #content>
              <span v-if="empty">条件内容</span>
            </template>
            <button class="btn" type="button">空 slot 内容</button>
          </Tooltip>
        </div>
      </OverlayHost>
    `,
  }),
})

ContentSlotsAndEmptyContent.test('proves slot and empty content behavior', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const slot = canvas.getByRole('button', { name: 'slot 内容' })
  const empty = canvas.getByRole('button', { name: '空内容' })
  const emptySlot = canvas.getByRole('button', { name: '空 slot 内容' })

  await userEvent.click(slot)
  await expect(canvas.getByRole('tooltip')).toHaveTextContent('由 content slot 提供的说明')
  await userEvent.keyboard('{Escape}')

  await userEvent.click(empty)
  await expect(empty).not.toHaveAttribute('aria-describedby')
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()

  await userEvent.click(emptySlot)
  await expect(emptySlot).not.toHaveAttribute('aria-describedby')
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
})

export const Placements = meta.story({
  name: '四个首选方向',
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <div class="grid min-h-96 grid-cols-2 place-items-center gap-20 p-24">
          <Tooltip content="top" placement="top">
            <button class="btn" type="button">top</button>
          </Tooltip>
          <Tooltip content="right" placement="right">
            <button class="btn" type="button">right</button>
          </Tooltip>
          <Tooltip content="bottom" placement="bottom">
            <button class="btn" type="button">bottom</button>
          </Tooltip>
          <Tooltip content="left" placement="left">
            <button class="btn" type="button">left</button>
          </Tooltip>
        </div>
      </OverlayHost>
    `,
  }),
})

Placements.test('proves the four preferred placements', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  for (const direction of ['top', 'right', 'bottom', 'left'] as const) {
    await userEvent.click(canvas.getByRole('button', { name: direction }))
    await expect(canvas.getByRole('tooltip')).toHaveAttribute('data-ui-placement', direction)
    await userEvent.keyboard('{Escape}')
  }
})

export const EdgeAndScroll = meta.story({
  name: '边缘翻转与滚动跟随',
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <div class="grid min-h-96 gap-8 p-8">
          <div class="relative h-40 overflow-hidden border border-base-content/20">
            <div class="absolute top-16 right-1">
              <Tooltip content="空间不足时向左翻转" placement="right">
                <button class="btn" type="button">边缘触发器</button>
              </Tooltip>
            </div>
          </div>
          <div data-ui-tooltip-scroll class="h-44 overflow-auto border border-base-content/20 p-3">
            <div class="h-96">
              <Tooltip content="滚动时持续跟随锚点">
                <button class="btn" type="button">滚动触发器</button>
              </Tooltip>
            </div>
          </div>
        </div>
      </OverlayHost>
    `,
  }),
})

EdgeAndScroll.test('proves edge collision and scroll tracking', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const edge = canvas.getByRole('button', { name: '边缘触发器' })

  await userEvent.click(edge)
  await expect(canvas.getByRole('tooltip')).toHaveAttribute('data-ui-placement', 'left')
  await userEvent.keyboard('{Escape}')

  const trigger = canvas.getByRole('button', { name: '滚动触发器' })
  const scroll = canvasElement.querySelector<HTMLElement>('[data-ui-tooltip-scroll]')
  if (!scroll)
    throw new Error('Tooltip scroll fixture did not render')

  await userEvent.click(trigger)
  const tooltip = canvas.getByRole('tooltip')
  const top = tooltip.getBoundingClientRect().top
  scroll.scrollTop = 80
  scroll.dispatchEvent(new Event('scroll'))

  await waitFor(async () => {
    await expect(tooltip.getBoundingClientRect().top).toBeLessThan(top)
  })
})

export const OverlayTargets = meta.story({
  name: 'Theme Host、显式目标与 body 回退',
  render: () => ({
    components: { OverlayHost, Tooltip },
    setup() {
      const target = ref<HTMLDivElement>()
      return { target }
    },
    template: `
      <div class="flex min-h-80 items-center justify-center gap-3 p-8">
        <OverlayHost>
          <Tooltip content="Theme Host 内的说明">
            <button class="btn" type="button">Host 触发器</button>
          </Tooltip>
        </OverlayHost>
        <div ref="target" data-ui-tooltip-target></div>
        <Tooltip content="显式目标内的说明" :to="target">
          <button class="btn" type="button">显式目标触发器</button>
        </Tooltip>
        <Tooltip content="body 回退中的说明">
          <button class="btn" type="button">回退触发器</button>
        </Tooltip>
      </div>
    `,
  }),
})

OverlayTargets.test('proves Overlay Host and target ownership', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')
  const target = canvasElement.querySelector<HTMLElement>('[data-ui-tooltip-target]')
  if (!host || !target)
    throw new Error('Tooltip overlay fixtures did not render')

  await userEvent.click(canvas.getByRole('button', { name: 'Host 触发器' }))
  const hosted = canvas.getByRole('tooltip')
  await expect(hosted.parentElement).toBe(host)
  await expect(host.closest('[data-theme]')).toHaveAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')
  await userEvent.keyboard('{Escape}')

  await userEvent.click(canvas.getByRole('button', { name: '显式目标触发器' }))
  await expect(canvas.getByRole('tooltip').parentElement).toBe(target)
  await userEvent.keyboard('{Escape}')

  await userEvent.click(canvas.getByRole('button', { name: '回退触发器' }))
  await expect(within(document.body).getByRole('tooltip').parentElement).toBe(document.body)
})
