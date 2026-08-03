import { Button, Dialog, Drawer } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'Integrations/ModalHost',
  component: Drawer,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'ModalHost 按真实打开顺序协调一个 Vue 应用内的 Dialog 与 Drawer。栈顶独占交互和蒙层，关闭时沿表面链恢复焦点；它不提供调用方可操作的公共栈接口。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const MixedStacks = meta.story({
  name: '混合表面栈与焦点回链',
  render: () => ({
    components: { Button, Dialog, Drawer },
    setup() {
      const parent = ref(false)
      const child = ref<'dialog' | 'drawer' | ''>('')

      function show() {
        parent.value = true
        child.value = ''
      }

      function closeParent() {
        parent.value = false
      }

      return { child, closeParent, parent, show }
    },
    template: `
      <main aria-label="Modal Host behavior" class="flex min-h-80 items-center justify-center p-6">
        <Button @click="show">Open parent Drawer</Button>

        <Drawer
          :open="parent"
          label="Parent Drawer"
          @update:open="parent = $event"
        >
          <div class="flex h-full flex-col gap-3 p-6">
            <Button @click="child = 'dialog'">Open child Dialog</Button>
            <Button @click="child = 'drawer'">Open child Drawer</Button>
            <Button class="mt-auto" @click="parent = false">Close parent Drawer</Button>
          </div>
        </Drawer>

        <Dialog
          :open="child === 'dialog'"
          label="Child Dialog"
          @update:open="child = $event ? 'dialog' : ''"
        >
          <div class="space-y-3">
            <p>The parent remains mounted below this Dialog.</p>
            <Button @click="closeParent">Remove parent programmatically</Button>
          </div>
          <template #actions>
            <Button @click="child = ''">Close child Dialog</Button>
          </template>
        </Dialog>

        <Drawer
          :open="child === 'drawer'"
          label="Child Drawer"
          placement="bottom"
          @update:open="child = $event ? 'drawer' : ''"
        >
          <div class="flex min-h-48 flex-col gap-3 p-6">
            <p>A Drawer can also be the top child.</p>
            <Button @click="closeParent">Remove parent under Drawer</Button>
            <Button class="mt-auto" @click="child = ''">Close child Drawer</Button>
          </div>
        </Drawer>
      </main>
    `,
  }),
})

function visibleBackdrops(canvas: HTMLElement) {
  return canvas.querySelectorAll('[open][data-ui-modal-backdrop="true"]')
}

MixedStacks.test('coordinates Drawer-to-Dialog and Drawer-to-Drawer stacks with a complete focus chain', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open parent Drawer' })

  trigger.focus()
  await userEvent.click(trigger)
  let parent = canvas.getByRole('dialog', { name: 'Parent Drawer' })
  let opener = within(parent).getByRole('button', { name: 'Open child Dialog' })

  await expect(visibleBackdrops(canvasElement)).toHaveLength(1)
  await expect(parent).not.toHaveAttribute('inert')
  await userEvent.click(opener)

  let child = canvas.getByRole('dialog', { name: 'Child Dialog' })

  await expect(parent).toHaveAttribute('inert')
  await expect(parent).toHaveAttribute('data-ui-modal-backdrop', 'false')
  await expect(child).not.toHaveAttribute('inert')
  await expect(child).toHaveAttribute('data-ui-modal-backdrop', 'true')
  await expect(visibleBackdrops(canvasElement)).toHaveLength(1)
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(child).not.toHaveAttribute('open'))
  await expect(opener).toHaveFocus()
  await expect(parent).not.toHaveAttribute('inert')

  opener = within(parent).getByRole('button', { name: 'Open child Drawer' })
  await userEvent.click(opener)
  child = canvas.getByRole('dialog', { name: 'Child Drawer' })
  await expect(parent).toHaveAttribute('inert')
  await expect(visibleBackdrops(canvasElement)).toHaveLength(1)
  await userEvent.click(within(child).getByRole('button', { name: 'Close child Drawer' }))
  await waitFor(() => expect(child).not.toHaveAttribute('open'))
  await expect(opener).toHaveFocus()

  await userEvent.click(within(parent).getByRole('button', { name: 'Close parent Drawer' }))
  await waitFor(() => expect(parent).not.toHaveAttribute('open'))
  await expect(trigger).toHaveFocus()

  await userEvent.click(trigger)
  parent = canvas.getByRole('dialog', { name: 'Parent Drawer' })
  await userEvent.click(within(parent).getByRole('button', { name: 'Open child Dialog' }))
  child = canvas.getByRole('dialog', { name: 'Child Dialog' })
  await userEvent.click(within(child).getByRole('button', { name: 'Remove parent programmatically' }))
  await waitFor(() => expect(parent).not.toHaveAttribute('open'))
  await expect(child).not.toHaveAttribute('inert')
  await expect(child).toHaveAttribute('data-ui-modal-backdrop', 'true')
  await expect(visibleBackdrops(canvasElement)).toHaveLength(1)
  await userEvent.click(within(child).getByRole('button', { name: 'Close child Dialog' }))
  await waitFor(() => expect(child).not.toHaveAttribute('open'))
  await expect(trigger).toHaveFocus()
})
