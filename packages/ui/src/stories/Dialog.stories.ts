import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button, Dialog } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'

const sizes = ['md', 'lg', 'xl', 'full'] as const

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  parameters: {
    docs: {
      description: {
        component:
          '受控的原生 Dialog 原语。它只负责模态结构、焦点与关闭策略；标题、内容与公共操作由应用通过 props 和 slots 组合。',
      },
    },
  },
  tags: ['autodocs', 'test'],
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Controlled: Story = {
  name: '受控状态与焦点',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const phase = ref('idle')

      return { open, phase }
    },
    template: `
      <main aria-label="Controlled Dialog" class="p-6">
        <Button @click="open = true">Open file dialog</Button>
        <output class="sr-only" aria-live="polite" data-ui-dialog-phase>{{ phase }}</output>

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
            <Button id="dialog-confirm" color="primary" @click="open = false">Move to recycle bin</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Open file dialog' })
    const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-phase]')

    if (!phase)
      throw new Error('Controlled Dialog story did not render its lifecycle output')

    trigger.focus()
    await userEvent.click(trigger)

    const dialog = canvas.getByRole('dialog', { name: 'Move selected files?' })
    const title = canvas.getByRole('heading', { name: 'Move selected files?' })
    const description = canvas.getByText('The selected files will remain available in the recycle bin.')
    const confirm = canvas.getByRole('button', { name: 'Move to recycle bin' })

    await expect(dialog).toHaveAttribute('open')
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
    await expect(dialog).toHaveAttribute('aria-labelledby', title.id)
    await expect(dialog).toHaveAttribute('aria-describedby', description.id)
    await expect(dialog.matches(':modal')).toBe(true)
    await waitFor(() => expect(confirm).toHaveFocus())

    trigger.focus()
    await expect(dialog.contains(document.activeElement)).toBe(true)

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel move' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    await expect(trigger).toHaveFocus()
    await expect(phase).toHaveTextContent('closed')
  },
}

export const LabelOnly: Story = {
  name: '仅 label 的可访问名称',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const empty = ref(false)
      const open = ref(false)

      return { empty, open }
    },
    template: `
      <main aria-label="Label-only Dialog" class="p-6">
        <Button @click="open = true">Open labelled dialog</Button>

        <Dialog
          :open="open"
          label="Archive options"
          @update:open="open = $event"
        >
          <template #title>
            <span v-if="empty">Hidden title</span>
          </template>
          <p>Archive settings are available without a visible dialog heading.</p>

          <template #actions>
            <Button @click="open = false">Close labelled dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Open labelled dialog' }))
    const dialog = canvas.getByRole('dialog', { name: 'Archive options' })

    await expect(dialog).toHaveAttribute('aria-label', 'Archive options')
    await expect(dialog).not.toHaveAttribute('aria-labelledby')

    await userEvent.click(canvas.getByRole('button', { name: 'Close labelled dialog' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  },
}

export const Unmounting: Story = {
  name: '卸载时恢复焦点',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const mounted = ref(true)

      const show = () => {
        mounted.value = true
        open.value = true
      }

      return { mounted, open, show }
    },
    template: `
      <main aria-label="Unmounting Dialog" class="p-6">
        <Button @click="show">Open unmounting dialog</Button>

        <Dialog
          v-if="mounted"
          :open="open"
          title="Unmounting dialog"
          @update:open="open = $event"
        >
          <template #actions>
            <Button @click="mounted = false">Unmount dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Open unmounting dialog' })

    trigger.focus()
    await userEvent.click(trigger)
    await userEvent.click(canvas.getByRole('button', { name: 'Unmount dialog' }))

    await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument())
    await expect(trigger).toHaveFocus()
  },
}

export const ClosePolicies: Story = {
  name: 'Escape 与蒙层策略',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref('')
      const reason = ref('none')
      const show = (value: string) => {
        open.value = value
        reason.value = 'none'
      }

      return { open, reason, show }
    },
    template: `
      <main aria-label="Dialog close policies" class="flex flex-wrap gap-3 p-6">
        <Button @click="show('default')">Open default policy</Button>
        <Button @click="show('escape')">Open Escape-protected</Button>
        <Button @click="show('backdrop')">Open backdrop-protected</Button>
        <output aria-live="polite" data-ui-dialog-reason>{{ reason }}</output>

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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const reason = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-reason]')

    if (!reason)
      throw new Error('Dialog close policy story did not render its close reason')

    await userEvent.click(canvas.getByRole('button', { name: 'Open default policy' }))
    let dialog = canvas.getByRole('dialog', { name: 'Default close policy' })
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(reason).toHaveTextContent('escape'))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))

    await userEvent.click(canvas.getByRole('button', { name: 'Open default policy' }))
    dialog = canvas.getByRole('dialog', { name: 'Default close policy' })
    await userEvent.click(dialog)
    await waitFor(() => expect(reason).toHaveTextContent('backdrop'))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))

    await userEvent.click(canvas.getByRole('button', { name: 'Open Escape-protected' }))
    dialog = canvas.getByRole('dialog', { name: 'Escape-protected policy' })
    await userEvent.keyboard('{Escape}')
    await expect(dialog).toHaveAttribute('open')
    await expect(reason).toHaveTextContent('none')
    await userEvent.click(canvas.getByRole('button', { name: 'Close Escape-protected' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))

    await userEvent.click(canvas.getByRole('button', { name: 'Open backdrop-protected' }))
    dialog = canvas.getByRole('dialog', { name: 'Backdrop-protected policy' })
    await userEvent.click(dialog)
    await expect(dialog).toHaveAttribute('open')
    await expect(reason).toHaveTextContent('none')
    await userEvent.click(canvas.getByRole('button', { name: 'Close backdrop-protected' }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  },
}

export const SizesAndResponsivePresentation: Story = {
  name: '尺寸与响应式呈现',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref('')

      return { open, sizes }
    },
    template: `
      <main aria-label="Dialog sizes" class="flex flex-wrap gap-3 p-6">
        <Button v-for="size in sizes" :key="size" @click="open = size">Open {{ size }}</Button>

        <Dialog
          v-for="size in sizes"
          :key="size"
          :open="open === size"
          :size="size"
          :title="size.toUpperCase() + ' dialog'"
          :description="size + ' presentation'"
          @update:open="open = $event ? size : ''"
        >
          <p>This content keeps its own layout and scrolling decisions.</p>

          <template #actions>
            <Button @click="open = ''">Close {{ size }}</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const desktop = window.matchMedia('(min-width: 40rem)').matches

    for (const size of sizes) {
      await userEvent.click(canvas.getByRole('button', { name: `Open ${size}` }))
      const dialog = canvas.getByRole('dialog', { name: `${size.toUpperCase()} dialog` })

      await expect(dialog).toHaveAttribute('data-ui-dialog-size', size)
      await expect(getComputedStyle(dialog).alignItems).toBe(desktop ? 'center' : 'flex-end')

      await userEvent.click(canvas.getByRole('button', { name: `Close ${size}` }))
      await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
    }
  },
}

export const ReducedMotion: Story = {
  name: '减少动态效果',
  render: () => ({
    components: { Button, Dialog },
    setup() {
      const open = ref(false)
      const phase = ref('idle')

      return { open, phase }
    },
    template: `
      <main aria-label="Reduced motion Dialog" class="p-6">
        <Button @click="open = true">Open reduced motion dialog</Button>
        <output aria-live="polite" data-ui-dialog-reduced-phase>{{ phase }}</output>

        <Dialog
          :open="open"
          title="Reduced motion dialog"
          description="When the user prefers reduced motion, opening and closing settle without a visible transition delay."
          @update:open="open = $event"
          @opened="phase = 'opened'"
          @closed="phase = 'closed'"
        >
          <template #actions>
            <Button @click="open = false">Close reduced motion dialog</Button>
          </template>
        </Dialog>
      </main>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const phase = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-reduced-phase]')

    if (!phase)
      throw new Error('Reduced motion Dialog story did not render its lifecycle output')

    await userEvent.click(canvas.getByRole('button', { name: 'Open reduced motion dialog' }))
    const dialog = canvas.getByRole('dialog', { name: 'Reduced motion dialog' })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      await expect(phase).toHaveTextContent('opened')
    else await waitFor(() => expect(phase).toHaveTextContent('opened'))

    await userEvent.click(canvas.getByRole('button', { name: 'Close reduced motion dialog' }))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      await expect(phase).toHaveTextContent('closed')
    else await waitFor(() => expect(phase).toHaveTextContent('closed'))
    await expect(dialog).not.toHaveAttribute('open')
  },
}
