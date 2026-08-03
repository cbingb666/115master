import type { DialogProps, DialogSize } from '@115master/ui'
import { Button, Dialog } from '@115master/ui'
import { useArgs } from 'storybook/preview-api'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../.storybook/preview'

const sizes = [
  'md',
  'lg',
  'xl',
  'full',
] as const satisfies readonly DialogSize[]

async function hidden(dialog: HTMLElement) {
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
}

const meta = preview.meta({
  title: 'UI/Dialog',
  component: Dialog,
  args: {
    open: false,
    size: 'md',
    closeOnEscape: true,
    closeOnBackdrop: true,
  },
  argTypes: {
    open: { control: 'boolean' },
    title: { control: 'text' },
    description: { control: 'text' },
    label: { control: 'text' },
    size: { control: 'inline-radio', options: sizes },
    closeOnEscape: { control: 'boolean' },
    closeOnBackdrop: { control: 'boolean' },
    initialFocus: { control: false },
  },
  render: (args) => {
    const [, update] = useArgs<DialogProps>()

    return {
      components: { Button, Dialog },
      setup: () => ({
        args,
        set: (open: boolean) => update({ open }),
      }),
      template: `
        <main aria-label="Default Dialog" class="flex min-h-80 items-center justify-center p-6">
          <Button
            aria-haspopup="dialog"
            :aria-expanded="args.open"
            @click="set(true)"
          >
            Open Dialog
          </Button>

          <Dialog
            v-bind="args"
            aria-label="Default Dialog"
            @update:open="set"
          >
            <p>Use the controls to explore the Dialog contract.</p>

            <template #actions>
              <Button color="primary" @click="set(false)">Close Dialog</Button>
            </template>
          </Dialog>
        </main>
      `,
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          '受控的原生模态原语，用于暂时阻断页面交互的应用流程。它负责模态结构、焦点、关闭策略与生命周期；业务文案、操作语义和命令式编排由应用或 Dialog Service 提供。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Sizes = meta.story({
  name: '尺寸与响应式呈现',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref<DialogSize>()
      const phase = ref('idle')

      function show(size: DialogSize) {
        open.value = size
        phase.value = `${size} opening`
      }

      return { open, phase, show, sizes }
    },
    template: `
      <main aria-label="Dialog sizes" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <div class="flex flex-wrap justify-center gap-3">
          <Button
            v-for="size in sizes"
            :key="size"
            aria-haspopup="dialog"
            :aria-expanded="open === size"
            @click="show(size)"
          >
            Open {{ size }}
          </Button>
        </div>
        <span>
          Phase:
          <output aria-live="polite" data-ui-dialog-size-phase>{{ phase }}</output>
        </span>

        <Dialog
          v-for="size in sizes"
          :key="size"
          :open="open === size"
          :size="size"
          :title="size.toUpperCase() + ' Dialog'"
          :description="size + ' responsive presentation'"
          @update:open="open = $event ? size : undefined"
          @opened="phase = size + ' opened'"
          @closed="phase = size + ' closed'"
        >
          <p>The content keeps its own layout and scrolling decisions.</p>

          <template #actions>
            <Button @click="open = undefined">Close {{ size }}</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

Sizes.test('proves sizes and responsive presentation', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const desktop = window.matchMedia('(min-width: 40rem)').matches
  const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-size-phase]')
  const widths: number[] = []

  if (!phase)
    throw new Error('Dialog sizes story did not render its observable phase')

  for (const size of sizes) {
    await userEvent.click(canvas.getByRole('button', { name: `Open ${size}` }))
    const dialog = await canvas.findByRole('dialog', { name: `${size.toUpperCase()} Dialog` })
    const panel = dialog.querySelector<HTMLElement>('[data-ui-dialog-panel]')

    if (!panel)
      throw new Error(`${size} Dialog did not render its public panel`)

    await expect(dialog).toHaveAttribute('data-ui-dialog-size', size)
    await waitFor(() => expect(phase).toHaveTextContent(`${size} opened`))
    await waitFor(() => expect(panel).toBeVisible())
    await expect(getComputedStyle(dialog).alignItems).toBe(desktop ? 'center' : 'flex-end')
    await waitFor(() => expect(panel.getBoundingClientRect().width).toBeCloseTo(panel.offsetWidth, 0))
    widths.push(panel.getBoundingClientRect().width)

    await userEvent.click(canvas.getByRole('button', { name: `Close ${size}` }))
    await hidden(dialog)
  }

  if (!desktop) {
    for (const width of widths)
      await expect(width).toBeCloseTo(window.innerWidth, 0)
    return
  }

  for (const [index, width] of widths.slice(1).entries())
    await expect(width).toBeGreaterThanOrEqual((widths[index] ?? 0) - 1)
  await expect(widths[widths.length - 1] ?? 0).toBeGreaterThan(widths[0] ?? 0)
})

export const Content = meta.story({
  name: '标题、描述与可访问名称',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref('')

      return { open }
    },
    template: `
      <main aria-label="Dialog content" class="flex min-h-80 flex-wrap items-center justify-center gap-3 p-6">
        <Button aria-haspopup="dialog" :aria-expanded="open === 'props'" @click="open = 'props'">
          Open prop content
        </Button>
        <Button aria-haspopup="dialog" :aria-expanded="open === 'slots'" @click="open = 'slots'">
          Open slot content
        </Button>
        <Button aria-haspopup="dialog" :aria-expanded="open === 'label'" @click="open = 'label'">
          Open label-only Dialog
        </Button>

        <Dialog
          :open="open === 'props'"
          title="Prop title"
          description="Prop description"
          @update:open="open = $event ? 'props' : ''"
        >
          <p>Default slot content.</p>

          <template #actions>
            <Button @click="open = ''">Close prop content</Button>
          </template>
        </Dialog>

        <Dialog
          :open="open === 'slots'"
          @update:open="open = $event ? 'slots' : ''"
        >
          <template #title>Slot title</template>
          <template #description>Slot description</template>
          <p>Default slot content.</p>

          <template #actions>
            <Button @click="open = ''">Close slot content</Button>
          </template>
        </Dialog>

        <Dialog
          :open="open === 'label'"
          label="Label-only Dialog"
          @update:open="open = $event ? 'label' : ''"
        >
          <p>The accessible name does not require a visible heading.</p>

          <template #actions>
            <Button @click="open = ''">Close label-only Dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

Content.test('proves prop, slot, and label-only accessible names', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Open prop content' }))
  let dialog = await canvas.findByRole('dialog', { name: 'Prop title' })
  let title = canvas.getByRole('heading', { name: 'Prop title' })
  let description = canvas.getByText('Prop description')

  await expect(dialog).toHaveAttribute('aria-labelledby', title.id)
  await expect(dialog).toHaveAttribute('aria-describedby', description.id)
  await userEvent.click(canvas.getByRole('button', { name: 'Close prop content' }))
  await hidden(dialog)

  await userEvent.click(canvas.getByRole('button', { name: 'Open slot content' }))
  dialog = await canvas.findByRole('dialog', { name: 'Slot title' })
  title = canvas.getByRole('heading', { name: 'Slot title' })
  description = canvas.getByText('Slot description')

  await expect(dialog).toHaveAttribute('aria-labelledby', title.id)
  await expect(dialog).toHaveAttribute('aria-describedby', description.id)
  await userEvent.click(canvas.getByRole('button', { name: 'Close slot content' }))
  await hidden(dialog)

  await userEvent.click(canvas.getByRole('button', { name: 'Open label-only Dialog' }))
  dialog = await canvas.findByRole('dialog', { name: 'Label-only Dialog' })

  await expect(dialog).toHaveAttribute('aria-label', 'Label-only Dialog')
  await expect(dialog).not.toHaveAttribute('aria-labelledby')
  await expect(within(dialog).queryByRole('heading')).not.toBeInTheDocument()
  await userEvent.click(canvas.getByRole('button', { name: 'Close label-only Dialog' }))
  await hidden(dialog)
})

export const Lifecycle = meta.story({
  name: '受控生命周期与焦点',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const phase = ref('idle')

      return { open, phase }
    },
    template: `
      <main aria-label="Dialog lifecycle" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <Button aria-haspopup="dialog" :aria-expanded="open" @click="open = true">
          Open lifecycle Dialog
        </Button>
        <span>
          Phase:
          <output aria-live="polite" data-ui-dialog-phase>{{ phase }}</output>
        </span>

        <Dialog
          :open="open"
          title="Move selected files?"
          description="The selected files will remain available in the recycle bin."
          initial-focus="#dialog-confirm"
          @update:open="open = $event"
          @opened="phase = 'opened'"
          @closed="phase = 'closed'"
        >
          <p>Choose where the selected files should go next.</p>

          <template #actions>
            <Button color="neutral" @click="open = false">Cancel move</Button>
            <Button id="dialog-confirm" color="primary" @click="open = false">
              Move to recycle bin
            </Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

Lifecycle.test('proves controlled state, lifecycle, and focus behavior', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open lifecycle Dialog' })
  const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-phase]')

  if (!phase)
    throw new Error('Dialog lifecycle story did not render its observable phase')

  trigger.focus()
  await userEvent.click(trigger)

  const dialog = await canvas.findByRole('dialog', { name: 'Move selected files?' })
  const title = canvas.getByRole('heading', { name: 'Move selected files?' })
  const description = canvas.getByText('The selected files will remain available in the recycle bin.')
  const confirm = canvas.getByRole('button', { name: 'Move to recycle bin' })

  await expect(dialog).toHaveAttribute('open')
  await expect(dialog).toHaveAttribute('aria-modal', 'true')
  await expect(dialog).toHaveAttribute('aria-labelledby', title.id)
  await expect(dialog).toHaveAttribute('aria-describedby', description.id)
  await expect(dialog.matches(':modal')).toBe(true)
  await waitFor(() => expect(confirm).toHaveFocus())
  await waitFor(() => expect(phase).toHaveTextContent('opened'))

  trigger.focus()
  await expect(dialog.contains(document.activeElement)).toBe(true)

  await userEvent.click(canvas.getByRole('button', { name: 'Cancel move' }))
  await hidden(dialog)
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toHaveFocus()
  await expect(phase).toHaveTextContent('closed')
})

export const Dismissal = meta.story({
  name: 'Escape 与蒙层关闭策略',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref('')
      const reason = ref('none')

      function show(value: 'default' | 'escape' | 'backdrop') {
        open.value = value
        reason.value = 'none'
      }

      return { open, reason, show }
    },
    template: `
      <main aria-label="Dialog dismissal" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <div class="flex flex-wrap justify-center gap-3">
          <Button aria-haspopup="dialog" :aria-expanded="open === 'default'" @click="show('default')">
            Open default policy
          </Button>
          <Button aria-haspopup="dialog" :aria-expanded="open === 'escape'" @click="show('escape')">
            Open Escape-protected
          </Button>
          <Button aria-haspopup="dialog" :aria-expanded="open === 'backdrop'" @click="show('backdrop')">
            Open backdrop-protected
          </Button>
        </div>
        <span>
          Close reason:
          <output aria-live="polite" data-ui-dialog-reason>{{ reason }}</output>
        </span>

        <Dialog
          :open="open === 'default'"
          title="Default close policy"
          description="Escape and backdrop clicks both request a close."
          @update:open="open = $event ? 'default' : ''"
          @close="reason = $event"
        >
          <template #actions>
            <Button @click="open = ''">Close default policy</Button>
          </template>
        </Dialog>

        <Dialog
          :open="open === 'escape'"
          title="Escape-protected policy"
          description="Escape remains available to the application, but does not request a close."
          :close-on-escape="false"
          @update:open="open = $event ? 'escape' : ''"
          @close="reason = $event"
        >
          <template #actions>
            <Button @click="open = ''">Close Escape-protected</Button>
          </template>
        </Dialog>

        <Dialog
          :open="open === 'backdrop'"
          title="Backdrop-protected policy"
          description="Backdrop clicks remain available to the application, but do not request a close."
          :close-on-backdrop="false"
          @update:open="open = $event ? 'backdrop' : ''"
          @close="reason = $event"
        >
          <template #actions>
            <Button @click="open = ''">Close backdrop-protected</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

Dismissal.test('proves Escape and backdrop close policies', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const reason = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-reason]')

  if (!reason)
    throw new Error('Dialog dismissal story did not render its observable close reason')

  await userEvent.click(canvas.getByRole('button', { name: 'Open default policy' }))
  let dialog = await canvas.findByRole('dialog', { name: 'Default close policy' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(reason).toHaveTextContent('escape'))
  await hidden(dialog)

  await userEvent.click(canvas.getByRole('button', { name: 'Open default policy' }))
  dialog = await canvas.findByRole('dialog', { name: 'Default close policy' })
  await userEvent.click(dialog)
  await waitFor(() => expect(reason).toHaveTextContent('backdrop'))
  await hidden(dialog)

  await userEvent.click(canvas.getByRole('button', { name: 'Open Escape-protected' }))
  dialog = await canvas.findByRole('dialog', { name: 'Escape-protected policy' })
  await userEvent.keyboard('{Escape}')
  await expect(dialog).toHaveAttribute('open')
  await expect(reason).toHaveTextContent('none')
  await userEvent.click(canvas.getByRole('button', { name: 'Close Escape-protected' }))
  await hidden(dialog)

  await userEvent.click(canvas.getByRole('button', { name: 'Open backdrop-protected' }))
  dialog = await canvas.findByRole('dialog', { name: 'Backdrop-protected policy' })
  await userEvent.click(dialog)
  await expect(dialog).toHaveAttribute('open')
  await expect(reason).toHaveTextContent('none')
  await userEvent.click(canvas.getByRole('button', { name: 'Close backdrop-protected' }))
  await hidden(dialog)
})

export const Unmounting = meta.story({
  name: '卸载时恢复焦点',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const mounted = ref(true)

      function show() {
        mounted.value = true
        open.value = true
      }

      function remove() {
        mounted.value = false
        open.value = false
      }

      return { mounted, open, remove, show }
    },
    template: `
      <main aria-label="Unmounting Dialog" class="flex min-h-80 items-center justify-center p-6">
        <Button aria-haspopup="dialog" :aria-expanded="open" @click="show">
          Open unmounting Dialog
        </Button>

        <Dialog
          v-if="mounted"
          :open="open"
          title="Unmounting Dialog"
          @update:open="open = $event"
        >
          <p>Unmounting restores focus to the element that opened the Dialog.</p>

          <template #actions>
            <Button @click="remove">Unmount Dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

Unmounting.test('restores focus when the Dialog unmounts', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open unmounting Dialog' })

  trigger.focus()
  await userEvent.click(trigger)
  await userEvent.click(await canvas.findByRole('button', { name: 'Unmount Dialog' }))

  await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(trigger).toHaveFocus()
})

export const ReducedMotion = meta.story({
  name: '减少动态效果',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const phase = ref('idle')

      return { open, phase }
    },
    template: `
      <main aria-label="Reduced motion Dialog" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <Button aria-haspopup="dialog" :aria-expanded="open" @click="open = true">
          Open reduced motion Dialog
        </Button>
        <span>
          Phase:
          <output aria-live="polite" data-ui-dialog-reduced-phase>{{ phase }}</output>
        </span>

        <Dialog
          :open="open"
          title="Reduced motion Dialog"
          description="Reduced motion settles opening and closing without a visible transition delay."
          @update:open="open = $event"
          @opened="phase = 'opened'"
          @closed="phase = 'closed'"
        >
          <template #actions>
            <Button @click="open = false">Close reduced motion Dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
})

ReducedMotion.test('proves reduced-motion lifecycle settlement', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-reduced-phase]')

  if (!phase)
    throw new Error('Reduced motion Dialog story did not render its observable phase')

  await userEvent.click(canvas.getByRole('button', { name: 'Open reduced motion Dialog' }))
  const dialog = await canvas.findByRole('dialog', { name: 'Reduced motion Dialog' })

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    await expect(phase).toHaveTextContent('opened')
  else await waitFor(() => expect(phase).toHaveTextContent('opened'))

  await userEvent.click(canvas.getByRole('button', { name: 'Close reduced motion Dialog' }))
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    await expect(phase).toHaveTextContent('closed')
  else await waitFor(() => expect(phase).toHaveTextContent('closed'))
  await expect(dialog).not.toHaveAttribute('open')
})
