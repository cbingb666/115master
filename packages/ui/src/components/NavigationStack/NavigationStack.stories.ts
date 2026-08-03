import { Button, Dialog, Drawer, NavigationStack } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/NavigationStack',
  component: NavigationStack,
  args: {
    title: 'Library',
    pageKey: 'library',
    depth: 0,
    canGoBack: false,
    closeLabel: 'Close navigation',
  },
  argTypes: {
    pageKey: { control: 'text' },
    depth: { control: { type: 'number', min: 0, step: 1 } },
    canGoBack: { control: 'boolean' },
    backLabel: { control: 'text' },
    closeLabel: { control: 'text' },
  },
  render: args => ({
    components: { NavigationStack },
    setup: () => ({ args }),
    template: `
      <main aria-label="Default Navigation Stack" class="p-6">
        <div class="ui-glass-panel mx-auto max-w-xl overflow-hidden rounded-box">
          <NavigationStack v-bind="args">
            <p>NavigationStack owns content navigation, not a modal surface.</p>
          </NavigationStack>
        </div>
      </main>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'NavigationStack 是无外壳的受控内容导航；用于在 Dialog 或 Drawer 内统一标题栏、滚动、返回与关闭意图。调用方拥有页面状态和表面开关，它不是路由器或模态原语。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Composition = meta.story({
  name: 'Dialog 与 Drawer 组合',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Dialog, Drawer, NavigationStack },
    setup() {
      const surface = ref<'dialog' | 'drawer' | ''>('')
      const result = ref('idle')

      function close() {
        result.value = `${surface.value} dismissed`
        surface.value = ''
      }

      return { close, result, surface }
    },
    template: `
      <main aria-label="Navigation Stack composition" class="flex min-h-80 flex-col items-center justify-center gap-3 p-6">
        <div class="flex gap-3">
          <Button @click="surface = 'dialog'">Open in Dialog</Button>
          <Button @click="surface = 'drawer'">Open in Drawer</Button>
        </div>
        <output class="sr-only" aria-live="polite" data-ui-navigation-composition>{{ result }}</output>

        <Dialog
          :open="surface === 'dialog'"
          label="Dialog navigation"
          size="lg"
          @update:open="surface = $event ? 'dialog' : ''"
        >
          <NavigationStack
            title="Dialog navigation"
            page-key="dialog"
            close-label="Close Dialog navigation"
            @dismiss="close"
          >
            <p class="min-h-40">The UI-owned integration is full-bleed without caller padding rules.</p>
          </NavigationStack>
        </Dialog>

        <Drawer
          :open="surface === 'drawer'"
          label="Drawer navigation"
          placement="bottom"
          size="lg"
          @update:open="surface = $event ? 'drawer' : ''"
        >
          <NavigationStack
            title="Drawer navigation"
            page-key="drawer"
            close-label="Close Drawer navigation"
            @dismiss="close"
          >
            <p class="min-h-40">The same shell-free navigation fills a bottom Drawer.</p>
          </NavigationStack>
        </Drawer>
      </main>
    `,
  }),
})

Composition.test('fills Dialog and Drawer surfaces and emits a close intent', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-navigation-composition]')

  if (!result)
    throw new Error('Navigation composition did not render its outcome')

  await userEvent.click(canvas.getByRole('button', { name: 'Open in Dialog' }))
  let surface = canvas.getByRole('dialog', { name: 'Dialog navigation' })
  const content = surface.querySelector<HTMLElement>('.ui-dialog__content')

  if (!content)
    throw new Error('Dialog navigation did not render its content region')
  await expect(getComputedStyle(content).padding).toBe('0px')
  await userEvent.click(within(surface).getByRole('button', { name: 'Close Dialog navigation' }))
  await waitFor(() => expect(surface).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('dialog dismissed')

  await userEvent.click(canvas.getByRole('button', { name: 'Open in Drawer' }))
  surface = canvas.getByRole('dialog', { name: 'Drawer navigation' })
  const panel = surface.querySelector<HTMLElement>('[data-ui-drawer-panel]')

  if (!panel)
    throw new Error('Drawer navigation did not render its public panel')
  await expect(panel.querySelector(':scope > [data-ui-navigation-stack]')).toBeInTheDocument()
  await userEvent.click(within(surface).getByRole('button', { name: 'Close Drawer navigation' }))
  await waitFor(() => expect(surface).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('drawer dismissed')
})

export const Navigation = meta.story({
  name: '多层导航、操作与高度变化',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, Drawer, NavigationStack },
    setup() {
      const open = ref(false)
      const page = ref<'root' | 'details' | 'summary' | 'advanced'>('root')
      const depth = computed(() => page.value === 'root' ? 0 : page.value === 'advanced' ? 2 : 1)
      const title = computed(() => ({
        root: 'Library',
        details: 'Item details',
        summary: 'Item summary',
        advanced: 'Advanced options',
      })[page.value])
      const result = ref('idle')

      function show() {
        page.value = 'root'
        result.value = 'idle'
        open.value = true
      }

      function back() {
        page.value = page.value === 'advanced' ? 'details' : 'root'
      }

      function dismiss() {
        result.value = 'dismissed'
        open.value = false
      }

      function commit() {
        result.value = `committed ${page.value}`
      }

      return { back, commit, depth, dismiss, open, page, result, show, title }
    },
    template: `
      <main aria-label="Navigation Stack behavior" class="p-6">
        <Button @click="show">Open navigation flow</Button>
        <output class="sr-only" aria-live="polite" data-ui-navigation-result>{{ result }}</output>

        <Drawer
          :open="open"
          :label="title"
          placement="bottom"
          size="lg"
          @update:open="open = $event"
        >
          <NavigationStack
            :title="title"
            :page-key="page"
            :depth="depth"
            :can-go-back="depth > 0"
            back-label="Go back"
            close-label="Close navigation flow"
            @back="back"
            @dismiss="dismiss"
          >
            <div v-if="page === 'root'" class="min-h-24 space-y-3">
              <p>Root content.</p>
              <Button @click="page = 'details'">Open details</Button>
            </div>
            <div v-else-if="page === 'details'" class="min-h-52 space-y-3">
              <p>First nested level with taller content.</p>
              <Button @click="page = 'summary'">Replace with summary</Button>
              <Button @click="page = 'advanced'">Open advanced options</Button>
            </div>
            <p v-else-if="page === 'summary'" class="min-h-32">Replacement content at the same depth.</p>
            <p v-else class="min-h-64">Second nested level.</p>

            <template #actions>
              <Button color="primary" @click="commit">Commit current page</Button>
            </template>
          </NavigationStack>
        </Drawer>
      </main>
    `,
  }),
})

Navigation.test('infers forward, replace, and back across multiple depths while animating bottom height', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-navigation-result]')

  if (!result)
    throw new Error('Navigation behavior did not render its outcome')

  await userEvent.click(canvas.getByRole('button', { name: 'Open navigation flow' }))
  let surface = canvas.getByRole('dialog', { name: 'Library' })
  const stack = surface.querySelector<HTMLElement>('[data-ui-navigation-stack]')
  const panel = surface.querySelector<HTMLElement>('[data-ui-drawer-panel]')

  if (!stack || !panel)
    throw new Error('Navigation behavior did not render its public geometry')

  const rootHeight = panel.getBoundingClientRect().height
  await userEvent.click(within(surface).getByRole('button', { name: 'Open details' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'forward')
  surface = canvas.getByRole('dialog', { name: 'Item details' })
  await waitFor(() => expect(panel.getBoundingClientRect().height).toBeGreaterThan(rootHeight))

  await userEvent.click(within(surface).getByRole('button', { name: 'Replace with summary' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'replace')
  surface = canvas.getByRole('dialog', { name: 'Item summary' })

  await userEvent.click(within(surface).getByRole('button', { name: 'Go back' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'back')
  surface = canvas.getByRole('dialog', { name: 'Library' })

  await userEvent.click(within(surface).getByRole('button', { name: 'Open details' }))
  surface = canvas.getByRole('dialog', { name: 'Item details' })
  await userEvent.click(within(surface).getByRole('button', { name: 'Open advanced options' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'forward')
  surface = canvas.getByRole('dialog', { name: 'Advanced options' })
  await userEvent.click(within(surface).getByRole('button', { name: 'Go back' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'back')

  surface = canvas.getByRole('dialog', { name: 'Item details' })
  await userEvent.click(within(surface).getByRole('button', { name: 'Commit current page' }))
  await expect(result).toHaveTextContent('committed details')
  await userEvent.click(within(surface).getByRole('button', { name: 'Close navigation flow' }))
  await waitFor(() => expect(surface).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('dismissed')
})
