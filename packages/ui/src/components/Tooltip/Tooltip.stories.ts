import type { TooltipPlacement } from '@115master/ui'
import { OverlayHost, Tooltip } from '@115master/ui'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const placements = [
  'top',
  'right',
  'bottom',
  'left',
] as const satisfies readonly TooltipPlacement[]

const meta = preview.meta({
  title: 'UI/Tooltip',
  component: Tooltip,
  args: {
    content: 'Supplemental details',
    placement: 'bottom',
    openDelay: 150,
    closeDelay: 50,
  },
  argTypes: {
    placement: { control: 'inline-radio', options: placements },
    openDelay: { control: { type: 'number', min: 0, step: 50 } },
    closeDelay: { control: { type: 'number', min: 0, step: 50 } },
    to: { control: false },
  },
  render: args => ({
    components: { OverlayHost, Tooltip },
    setup: () => ({ args }),
    template: `
      <OverlayHost>
        <main aria-label="Default Tooltip" class="flex min-h-80 items-center justify-center p-8">
          <Tooltip v-bind="args">
            <button class="btn" type="button">View details</button>
          </Tooltip>
        </main>
      </OverlayHost>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Tooltip 是锚点悬停或键盘聚焦时显示的非交互补充说明；用于提供非必要上下文。完成任务所需的信息或操作必须放在主体内容或其他交互浮层中。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Placements = meta.story({
  name: '首选方向',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    setup: () => ({ placements }),
    template: `
      <OverlayHost>
        <main aria-label="Tooltip 首选方向" class="grid min-h-96 grid-cols-2 place-items-center gap-20 p-24">
          <Tooltip
            v-for="placement in placements"
            :key="placement"
            :content="placement"
            :placement="placement"
          >
            <button class="btn" type="button">{{ placement }}</button>
          </Tooltip>
        </main>
      </OverlayHost>
    `,
  }),
})

Placements.test('uses each public preferred placement', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  for (const placement of placements) {
    await userEvent.click(canvas.getByRole('button', { name: placement }))
    await expect(canvas.getByRole('tooltip')).toHaveAttribute('data-ui-placement', placement)
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
    })
  }
})

export const Content = meta.story({
  name: '内容与空值',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    setup() {
      const empty = ref(false)

      return { empty }
    },
    template: `
      <OverlayHost>
        <main aria-label="Tooltip 内容" class="flex min-h-80 flex-wrap items-center justify-center gap-3 p-8">
          <Tooltip>
            <template #content>
              <span>Slot supplemental details</span>
            </template>
            <button class="btn" type="button">Slot content</button>
          </Tooltip>
          <Tooltip>
            <button class="btn" type="button">Empty content</button>
          </Tooltip>
          <Tooltip>
            <template #content>
              <span v-if="empty">Conditional details</span>
            </template>
            <button class="btn" type="button">Empty slot</button>
          </Tooltip>
        </main>
      </OverlayHost>
    `,
  }),
})

Content.test('renders slot content and omits empty descriptions', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const slot = canvas.getByRole('button', { name: 'Slot content' })
  const empty = canvas.getByRole('button', { name: 'Empty content' })
  const emptySlot = canvas.getByRole('button', { name: 'Empty slot' })

  await userEvent.click(slot)
  await expect(canvas.getByRole('tooltip')).toHaveTextContent('Slot supplemental details')
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  await userEvent.click(empty)
  await expect(empty).not.toHaveAttribute('aria-describedby')
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()

  await userEvent.click(emptySlot)
  await expect(emptySlot).not.toHaveAttribute('aria-describedby')
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
})

export const Positioning = meta.story({
  name: '视口边缘避让',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <main aria-label="Tooltip 视口避让" class="relative min-h-80 overflow-hidden p-8">
          <div class="absolute top-32 right-1">
            <Tooltip content="Flipped away from the edge" placement="right">
              <button class="btn" type="button">Edge anchor</button>
            </Tooltip>
          </div>
        </main>
      </OverlayHost>
    `,
  }),
})

Positioning.test('flips away from the viewport edge', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Edge anchor' }))
  await expect(canvas.getByRole('tooltip')).toHaveAttribute('data-ui-placement', 'left')
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

export const ScrollTracking = meta.story({
  name: '滚动跟随',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <main aria-label="Tooltip 滚动跟随" class="flex min-h-80 items-center justify-center p-8">
          <div data-ui-tooltip-scroll class="h-44 w-72 overflow-auto border border-base-content/20 p-3">
            <div class="h-96">
              <Tooltip content="Tracks the scrolling anchor">
                <button class="btn" type="button">Scrolling anchor</button>
              </Tooltip>
            </div>
          </div>
        </main>
      </OverlayHost>
    `,
  }),
})

ScrollTracking.test('tracks its anchor while the container scrolls', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const scroll = canvasElement.querySelector<HTMLElement>('[data-ui-tooltip-scroll]')

  if (!scroll)
    throw new Error('Tooltip scroll fixture did not render')

  await userEvent.click(canvas.getByRole('button', { name: 'Scrolling anchor' }))
  const tooltip = canvas.getByRole('tooltip')
  const top = tooltip.getBoundingClientRect().top

  scroll.scrollTop = 80
  await fireEvent.scroll(scroll)
  await waitFor(async () => {
    await expect(tooltip.getBoundingClientRect().top).toBeLessThan(top)
  })

  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })
  scroll.scrollTop = 0
  await fireEvent.scroll(scroll)
})

export const OverlayTargets = meta.story({
  name: 'Theme Host、显式目标与 body 回退',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    setup() {
      const target = ref<HTMLDivElement>()

      return { target }
    },
    template: `
      <main aria-label="Tooltip 浮层目标" class="flex min-h-80 flex-wrap items-center justify-center gap-3 p-8">
        <OverlayHost>
          <Tooltip content="Hosted supplemental details">
            <button class="btn" type="button">Host anchor</button>
          </Tooltip>
        </OverlayHost>
        <div ref="target" data-ui-tooltip-target></div>
        <Tooltip content="Explicit target details" :to="target">
          <button class="btn" type="button">Explicit target anchor</button>
        </Tooltip>
        <Tooltip content="Body fallback details">
          <button class="btn" type="button">Fallback anchor</button>
        </Tooltip>
      </main>
    `,
  }),
})

OverlayTargets.test('resolves hosted, explicit, and body fallback targets', async ({ canvasElement, globals }) => {
  const canvas = within(canvasElement)
  const host = canvasElement.querySelector<HTMLElement>('[data-ui-overlay-host]')
  const target = canvasElement.querySelector<HTMLElement>('[data-ui-tooltip-target]')

  if (!host || !target)
    throw new Error('Tooltip overlay fixtures did not render')

  await userEvent.click(canvas.getByRole('button', { name: 'Host anchor' }))
  let tooltip = canvas.getByRole('tooltip')
  await expect(tooltip.parentElement).toBe(host)
  await expect(host.closest('[data-theme]')).toHaveAttribute('data-theme', globals.theme === 'dark' ? 'dark' : 'light')
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  await userEvent.click(canvas.getByRole('button', { name: 'Explicit target anchor' }))
  tooltip = canvas.getByRole('tooltip')
  await expect(tooltip.parentElement).toBe(target)
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  await userEvent.click(canvas.getByRole('button', { name: 'Fallback anchor' }))
  const body = within(document.body)
  tooltip = body.getByRole('tooltip', { name: 'Body fallback details' })
  await expect(tooltip.parentElement).toBe(document.body)
  await userEvent.keyboard('{Escape}')
  await waitFor(async () => {
    await expect(body.queryByRole('tooltip', { name: 'Body fallback details' })).not.toBeInTheDocument()
  })
})

export const Interaction = meta.story({
  name: '指针、键盘与 ARIA',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { OverlayHost, Tooltip },
    template: `
      <OverlayHost>
        <main aria-label="Tooltip 交互" class="flex min-h-80 items-center justify-center gap-3 p-8">
          <Tooltip content="Pointer and keyboard details">
            <button class="btn" type="button">Description anchor</button>
          </Tooltip>
          <button class="btn" type="button">Next control</button>
        </main>
      </OverlayHost>
    `,
  }),
})

Interaction.test('supports delayed pointer and keyboard-accessible disclosure', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Description anchor' })

  await userEvent.hover(trigger)
  await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  await waitFor(async () => {
    await expect(canvas.getByRole('tooltip')).toBeVisible()
  })

  await userEvent.unhover(trigger)
  await expect(canvas.getByRole('tooltip')).toBeVisible()
  await waitFor(async () => {
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  await userEvent.tab()
  const tooltip = canvas.getByRole('tooltip')
  await expect(trigger).toHaveFocus()
  await expect(tooltip).toHaveAttribute('role', 'tooltip')
  await expect(trigger).toHaveAttribute('aria-describedby', tooltip.id)

  await userEvent.tab()
  await expect(canvas.getByRole('button', { name: 'Next control' })).toHaveFocus()
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
