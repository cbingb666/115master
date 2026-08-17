import type { DrawerPlacement, DrawerProps, DrawerSize } from '@115master/ui'
import { Button, Drawer } from '@115master/ui'
import { useArgs } from 'storybook/preview-api'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const placements = [
  'start',
  'end',
  'bottom',
] as const satisfies readonly DrawerPlacement[]

const motions: Record<DrawerPlacement, string> = {
  start: 'ui-drawer-enter-start',
  end: 'ui-drawer-enter-end',
  bottom: 'ui-drawer-enter-bottom',
}

const sizes = [
  'sm',
  'md',
  'lg',
  'full',
] as const satisfies readonly DrawerSize[]

async function hidden(drawer: HTMLElement) {
  await waitFor(() => expect(drawer).not.toHaveAttribute('open'))
  await frame()
}

function frame() {
  return new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
}

function opening(drawer: HTMLElement, panel: HTMLElement) {
  return new Promise<{
    drawerRect: DOMRect
    matrix: DOMMatrixReadOnly
    opacity: number
    panelRect: DOMRect
    scrollLeft: number
    scrollTop: number
  }>((resolve) => {
    const observer = new MutationObserver(() => {
      if (drawer.dataset.uiDrawerState !== 'open')
        return
      observer.disconnect()
      resolve({
        drawerRect: drawer.getBoundingClientRect(),
        matrix: new DOMMatrixReadOnly(getComputedStyle(panel).transform),
        opacity: Number.parseFloat(getComputedStyle(drawer).opacity),
        panelRect: panel.getBoundingClientRect(),
        scrollLeft: drawer.scrollLeft,
        scrollTop: drawer.scrollTop,
      })
    })

    observer.observe(drawer, {
      attributeFilter: ['data-ui-drawer-state'],
      attributes: true,
    })
  })
}

const meta = preview.meta({
  title: 'UI/Drawer',
  component: Drawer,
  args: {
    open: false,
    label: 'Default Drawer',
    placement: 'end',
    size: 'md',
    closeOnEscape: true,
    closeOnBackdrop: true,
    closeOnSwipe: true,
  },
  argTypes: {
    open: { control: 'boolean' },
    label: { control: 'text' },
    placement: { control: 'inline-radio', options: placements },
    size: { control: 'inline-radio', options: sizes },
    closeOnEscape: { control: 'boolean' },
    closeOnBackdrop: { control: 'boolean' },
    closeOnSwipe: { control: 'boolean' },
    initialFocus: { control: false },
  },
  render: (args) => {
    const [, update] = useArgs<DrawerProps>()

    return {
      components: { Button, Drawer },
      setup: () => ({
        args,
        set: (open: boolean) => update({ open }),
      }),
      template: `
        <main aria-label="Default Drawer" class="flex min-h-80 items-center justify-center p-6">
          <Button aria-haspopup="dialog" :aria-expanded="args.open" @click="set(true)">
            Open Drawer
          </Button>
          <Drawer v-bind="args" @update:open="set">
            <div class="flex min-h-48 flex-1 flex-col gap-4 p-6">
              <p>The default slot directly fills the modal panel.</p>
              <Button class="mt-auto" @click="set(false)">Close Drawer</Button>
            </div>
          </Drawer>
        </main>
      `,
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'Drawer 是受控的原生模态边缘表面；适合从 start、end 或 bottom 临时覆盖内容。它只提供面板、关闭策略和生命周期，不添加业务标题、操作区或滚动容器。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Placements = meta.story({
  name: '位置',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer },
    setup() {
      const open = ref<DrawerPlacement>()
      return { open, placements }
    },
    template: `
      <main aria-label="Drawer placements" class="flex min-h-80 flex-wrap items-center justify-center gap-3 p-6">
        <Button v-for="placement in placements" :key="placement" @click="open = placement">
          Open {{ placement }} Drawer
        </Button>
        <Drawer
          v-for="placement in placements"
          :key="placement"
          :open="open === placement"
          :label="placement + ' Drawer'"
          :placement="placement"
          size="sm"
          @update:open="open = $event ? placement : undefined"
        >
          <div class="min-h-40 p-6">{{ placement }} placement</div>
        </Drawer>
      </main>
    `,
  }),
})

Placements.test('slides every placement in from its anchored edge and exposes the bottom drag handle', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  for (const placement of placements) {
    const drawer = canvasElement.querySelector<HTMLDialogElement>(`[data-ui-drawer-placement="${placement}"]`)

    if (!drawer)
      throw new Error(`${placement} Drawer did not render its modal root`)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    const panel = drawer.querySelector<HTMLElement>('[data-ui-drawer-panel]')

    if (!panel)
      throw new Error(`${placement} Drawer did not expose its panel`)
    const focusTarget = panel.firstElementChild

    if (!(focusTarget instanceof HTMLElement))
      throw new Error(`${placement} Drawer did not render focusable test content`)
    focusTarget.tabIndex = 0
    const sample = opening(drawer, panel)

    canvas.getByRole('button', { name: `Open ${placement} Drawer` }).click()
    await expect(drawer).toHaveAttribute('data-ui-drawer-placement', placement)
    const start = await sample
    const animation = panel.getAnimations().find((candidate): candidate is CSSAnimation => (
      candidate instanceof CSSAnimation && candidate.animationName === motions[placement]
    ))

    await expect(drawer).toHaveAttribute('data-ui-drawer-state', 'open')
    await expect(start.opacity).toBe(1)

    if (reduced) {
      await expect(start.matrix.m41).toBe(0)
      await expect(start.matrix.m42).toBe(0)
    }
    if (!reduced) {
      await expect(animation).toBeDefined()
      const initial = placement === 'bottom' ? start.matrix.m42 : start.matrix.m41
      const extent = placement === 'bottom' ? panel.offsetHeight : panel.offsetWidth
      const rendered = placement === 'start'
        ? start.panelRect.left - start.drawerRect.left
        : placement === 'end'
          ? start.panelRect.right - start.drawerRect.right
          : start.panelRect.bottom - start.drawerRect.bottom

      await expect(Math.sign(initial)).toBe(placement === 'start' ? -1 : 1)
      await expect(Math.abs(initial)).toBeGreaterThan(extent * 0.5)
      await expect(rendered).toBeCloseTo(initial, 0)
      await expect(start.scrollLeft).toBe(0)
      await expect(start.scrollTop).toBe(0)
      await waitFor(() => {
        const moved = new DOMMatrixReadOnly(getComputedStyle(panel).transform)
        const current = placement === 'bottom' ? moved.m42 : moved.m41

        expect(Math.abs(current)).toBeGreaterThan(0)
        expect(Math.abs(current)).toBeLessThan(Math.abs(initial))
      })
    }
    await waitFor(
      () => expect(getComputedStyle(panel).transform).toBe('matrix(1, 0, 0, 1, 0, 0)'),
      { timeout: 1000 },
    )
    await expect(!!drawer.querySelector('[data-ui-drawer-drag-handle]')).toBe(placement === 'bottom')
    await userEvent.keyboard('{Escape}')
    await hidden(drawer)
  }
})

export const Sizes = meta.story({
  name: '底部语义尺寸与变量覆盖',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer },
    setup() {
      const open = ref<DrawerSize | 'override'>()
      return { open, sizes }
    },
    template: `
      <main aria-label="Drawer sizes" class="flex min-h-80 flex-wrap items-center justify-center gap-3 p-6">
        <Button v-for="size in sizes" :key="size" @click="open = size">Open {{ size }}</Button>
        <Button @click="open = 'override'">Open override</Button>
        <Drawer
          v-for="size in sizes"
          :key="size"
          :open="open === size"
          :label="size + ' Drawer'"
          placement="bottom"
          :size="size"
          @update:open="open = $event ? size : undefined"
        >
          <div class="min-h-40 p-6">{{ size }} size</div>
        </Drawer>
        <Drawer
          :open="open === 'override'"
          label="Override Drawer"
          placement="bottom"
          size="lg"
          style="--ui-drawer-size: 18rem"
          @update:open="open = $event ? 'override' : undefined"
        >
          <div class="min-h-40 p-6">Public variable override</div>
        </Drawer>
      </main>
    `,
  }),
})

Sizes.test('maps bottom semantic sizes to panel heights and permits a placement-axis CSS override', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  const values: Record<DrawerSize, string> = {
    sm: '20rem',
    md: '32rem',
    lg: '44rem',
    full: '100%',
  }

  for (const size of sizes) {
    await userEvent.click(canvas.getByRole('button', { name: `Open ${size}` }))
    const drawer = canvas.getByRole('dialog', { name: `${size} Drawer` })
    const panel = drawer.querySelector<HTMLElement>('[data-ui-drawer-panel]')

    if (!panel)
      throw new Error(`${size} Drawer did not expose its panel`)

    await expect(drawer).toHaveAttribute('data-ui-drawer-size', size)
    await expect(getComputedStyle(drawer).getPropertyValue('--ui-drawer-size').trim()).toBe(values[size])
    await expect(panel.getBoundingClientRect().height).toBe(size === 'full'
      ? window.innerHeight
      : Math.min(Number.parseFloat(values[size]) * rem, window.innerHeight - rem))
    await userEvent.keyboard('{Escape}')
    await hidden(drawer)
  }

  await userEvent.click(canvas.getByRole('button', { name: 'Open override' }))
  const drawer = canvas.getByRole('dialog', { name: 'Override Drawer' })
  const panel = drawer.querySelector<HTMLElement>('[data-ui-drawer-panel]')

  if (!panel)
    throw new Error('Override Drawer did not expose its panel')

  await expect(getComputedStyle(drawer).getPropertyValue('--ui-drawer-size').trim()).toBe('18rem')
  await expect(panel.getBoundingClientRect().height).toBe(18 * rem)
  await userEvent.keyboard('{Escape}')
  await hidden(drawer)
})

export const Lifecycle = meta.story({
  name: '生命周期、关闭策略与焦点',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer },
    setup() {
      const open = ref(false)
      const phase = ref('idle')
      const reason = ref('none')
      const protectedOpen = ref(false)
      return { open, phase, protectedOpen, reason }
    },
    template: `
      <main aria-label="Drawer lifecycle" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <div class="flex gap-3">
          <Button @click="open = true">Open lifecycle Drawer</Button>
          <Button @click="protectedOpen = true">Open protected Drawer</Button>
        </div>
        <output aria-live="polite" data-ui-drawer-phase>{{ phase }}</output>
        <output aria-live="polite" data-ui-drawer-reason>{{ reason }}</output>

        <Drawer
          :open="open"
          label="Lifecycle Drawer"
          initial-focus="#drawer-focus"
          @update:open="open = $event"
          @close="reason = $event"
          @opened="phase = 'opened'"
          @closed="phase = 'closed'"
        >
          <div class="flex h-full flex-col gap-4 p-6">
            <Button id="drawer-focus" @click="open = false">Focused close</Button>
          </div>
        </Drawer>

        <Drawer
          :open="protectedOpen"
          label="Protected Drawer"
          :close-on-escape="false"
          :close-on-backdrop="false"
          @update:open="protectedOpen = $event"
          @close="reason = $event"
        >
          <div class="p-6"><Button @click="protectedOpen = false">Close protected</Button></div>
        </Drawer>
      </main>
    `,
  }),
})

Lifecycle.test('settles lifecycle, applies dismissal policies, and restores trigger focus', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open lifecycle Drawer' })
  const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-drawer-phase]')
  const reason = canvasElement.querySelector<HTMLOutputElement>('[data-ui-drawer-reason]')

  if (!phase || !reason)
    throw new Error('Drawer lifecycle did not render its outcomes')

  trigger.focus()
  await userEvent.click(trigger)
  let drawer = canvas.getByRole('dialog', { name: 'Lifecycle Drawer' })

  await waitFor(() => expect(canvas.getByRole('button', { name: 'Focused close' })).toHaveFocus())
  await waitFor(() => expect(phase).toHaveTextContent('opened'))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(reason).toHaveTextContent('escape'))
  await hidden(drawer)
  await expect(trigger).toHaveFocus()
  await expect(phase).toHaveTextContent('closed')

  await userEvent.click(canvas.getByRole('button', { name: 'Open protected Drawer' }))
  drawer = canvas.getByRole('dialog', { name: 'Protected Drawer' })
  await userEvent.keyboard('{Escape}')
  await userEvent.click(drawer)
  await expect(drawer).toHaveAttribute('open')
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close protected' }))
  await hidden(drawer)
})

export const Swipe = meta.story({
  name: '底部滑动与受控拒绝',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer },
    setup() {
      const open = ref<'accepted' | 'rejected' | ''>('')
      const reason = ref('none')

      function update(value: boolean) {
        if (open.value === 'rejected')
          return
        open.value = value ? 'accepted' : ''
      }

      return { open, reason, update }
    },
    template: `
      <main aria-label="Drawer swipe" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <div class="flex gap-3">
          <Button @click="open = 'accepted'">Open swipe Drawer</Button>
          <Button @click="open = 'rejected'">Open rejecting Drawer</Button>
        </div>
        <output class="sr-only" aria-live="polite" data-ui-drawer-swipe-reason>{{ reason }}</output>

        <Drawer
          :open="open === 'accepted'"
          label="Swipe Drawer"
          placement="bottom"
          @update:open="update"
          @close="reason = $event"
        >
          <div class="min-h-48 p-6">Swipe the public handle downward.</div>
        </Drawer>
        <Drawer
          :open="open === 'rejected'"
          label="Rejecting Drawer"
          placement="bottom"
          @update:open="update"
          @close="reason = $event"
        >
          <div class="min-h-48 p-6"><Button @click="open = ''">Close rejecting Drawer</Button></div>
        </Drawer>
      </main>
    `,
  }),
})

function drag(handle: HTMLElement, distance: number, type: 'pointerup' | 'pointercancel' = 'pointerup') {
  const bounds = handle.getBoundingClientRect()
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  const options = {
    bubbles: true,
    button: 0,
    clientX: x,
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
  }

  handle.dispatchEvent(new PointerEvent('pointerdown', { ...options, clientY: y }))
  handle.dispatchEvent(new PointerEvent('pointermove', { ...options, clientY: y + distance }))
  handle.dispatchEvent(new PointerEvent(type, { ...options, clientY: y + distance }))
}

Swipe.test('dismisses past the threshold and snaps back after rejection or cancellation', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const reason = canvasElement.querySelector<HTMLOutputElement>('[data-ui-drawer-swipe-reason]')

  if (!reason)
    throw new Error('Drawer swipe did not render its outcome')

  await userEvent.click(canvas.getByRole('button', { name: 'Open swipe Drawer' }))
  let drawer = canvas.getByRole('dialog', { name: 'Swipe Drawer' })
  let handle = drawer.querySelector<HTMLElement>('[data-ui-drawer-drag-handle]')

  if (!handle)
    throw new Error('Swipe Drawer did not expose its handle')
  drag(handle, 120)
  await waitFor(() => expect(reason).toHaveTextContent('swipe'))
  await hidden(drawer)

  await userEvent.click(canvas.getByRole('button', { name: 'Open rejecting Drawer' }))
  drawer = canvas.getByRole('dialog', { name: 'Rejecting Drawer' })
  handle = drawer.querySelector<HTMLElement>('[data-ui-drawer-drag-handle]')
  const panel = drawer.querySelector<HTMLElement>('[data-ui-drawer-panel]')

  if (!handle || !panel)
    throw new Error('Rejecting Drawer did not expose its swipe geometry')
  drag(handle, 120)
  await expect(drawer).toHaveAttribute('open')
  await waitFor(() => expect(getComputedStyle(panel).transform).toBe('matrix(1, 0, 0, 1, 0, 0)'))
  drag(handle, 48, 'pointercancel')
  await waitFor(() => expect(getComputedStyle(panel).transform).toBe('matrix(1, 0, 0, 1, 0, 0)'))
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close rejecting Drawer' }))
  await hidden(drawer)
})

export const ReducedMotion = meta.story({
  name: '减少动态效果',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer },
    setup() {
      const open = ref(false)
      const phase = ref('idle')
      return { open, phase }
    },
    template: `
      <main aria-label="Reduced motion Drawer" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <Button @click="open = true">Open reduced Drawer</Button>
        <output aria-live="polite" data-ui-drawer-reduced-phase>{{ phase }}</output>
        <Drawer
          :open="open"
          label="Reduced Drawer"
          @update:open="open = $event"
          @opened="phase = 'opened'"
          @closed="phase = 'closed'"
        >
          <div class="p-6"><Button @click="open = false">Close reduced Drawer</Button></div>
        </Drawer>
      </main>
    `,
  }),
})

ReducedMotion.test('settles immediately when reduced motion is active', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-drawer-reduced-phase]')

  if (!phase)
    throw new Error('Reduced Drawer did not render its phase')

  await userEvent.click(canvas.getByRole('button', { name: 'Open reduced Drawer' }))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    await expect(phase).toHaveTextContent('opened')
  else await waitFor(() => expect(phase).toHaveTextContent('opened'))

  const drawer = canvas.getByRole('dialog', { name: 'Reduced Drawer' })
  await userEvent.click(within(drawer).getByRole('button', { name: 'Close reduced Drawer' }))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    await expect(phase).toHaveTextContent('closed')
  else await waitFor(() => expect(phase).toHaveTextContent('closed'))
})
