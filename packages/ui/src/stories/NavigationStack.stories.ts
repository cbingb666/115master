import type { DialogSize, NavigationStackMobilePresentation } from '@115master/ui'
import { Button, NavigationStack } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref, watch } from 'vue'
import preview from '../../.storybook/preview'

const presentations = [
  'fullscreen',
  'sheet',
] as const satisfies readonly NavigationStackMobilePresentation[]

const sizes = [
  'md',
  'lg',
  'xl',
  'full',
] as const satisfies readonly DialogSize[]

const meta = preview.meta({
  title: 'UI/NavigationStack',
  component: NavigationStack,
  args: {
    open: false,
    title: 'Library',
    pageKey: 'library',
    depth: 0,
    mobilePresentation: 'fullscreen',
    canGoBack: false,
    closeLabel: 'Close navigation stack',
    size: 'lg',
    closeOnEscape: true,
    closeOnBackdrop: true,
  },
  argTypes: {
    pageKey: { control: 'text' },
    depth: { control: { type: 'number', min: 0, step: 1 } },
    mobilePresentation: { control: 'inline-radio', options: presentations },
    canGoBack: { control: false },
    backLabel: { control: false },
    size: { control: 'inline-radio', options: sizes },
    initialFocus: { control: false },
  },
  render: args => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref(args.open)

      watch(() => args.open, value => open.value = value)

      return { args, open }
    },
    template: `
      <main aria-label="Default Navigation Stack" class="p-6">
        <Button @click="open = true">Open navigation stack</Button>

        <NavigationStack
          v-bind="args"
          :open="open"
          @update:open="open = $event"
        >
          <p>Temporary navigation content.</p>
        </NavigationStack>
      </main>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'NavigationStack 是受控的临时分层导航原语；用于在模态工作流中统一标题栏、内容滚动、返回与关闭意图。调用方拥有页面状态和业务内容，它不是应用路由容器。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
  args: {
    title: 'Library',
    pageKey: 'library',
    closeLabel: 'Close navigation stack',
  },
})

export const ResponsivePresentation = meta.story({
  name: '响应式呈现',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref<NavigationStackMobilePresentation | ''>('')

      return { open, presentations }
    },
    template: `
      <main aria-label="Navigation Stack presentations" class="flex flex-wrap gap-3 p-6">
        <Button
          v-for="presentation in presentations"
          :key="presentation"
          @click="open = presentation"
        >
          Open {{ presentation }} presentation
        </Button>

        <NavigationStack
          v-for="presentation in presentations"
          :key="presentation"
          :open="open === presentation"
          :title="presentation + ' presentation'"
          :page-key="presentation"
          :mobile-presentation="presentation"
          :close-label="'Close ' + presentation + ' presentation'"
          @update:open="open = $event ? presentation : ''"
        >
          <p class="min-h-32">The mobile viewport distinguishes a full-screen page from a content-height sheet.</p>
        </NavigationStack>
      </main>
    `,
  }),
})

ResponsivePresentation.test('adapts full-screen and sheet presentations to the viewport', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const mobile = window.matchMedia('(width < 40rem)').matches

  for (const presentation of presentations) {
    await userEvent.click(canvas.getByRole('button', { name: `Open ${presentation} presentation` }))

    const dialog = canvas.getByRole('dialog', { name: `${presentation} presentation` })
    const stack = dialog.querySelector<HTMLElement>('[data-ui-navigation-stack]')

    if (!stack)
      throw new Error('Navigation Stack presentation story did not render its stack')

    await expect(stack).toHaveAttribute('data-ui-navigation-mobile-presentation', presentation)

    const handle = stack.querySelector<HTMLElement>('[data-ui-navigation-drag-handle]')

    if (mobile && presentation === 'sheet') {
      if (!handle)
        throw new Error('Sheet presentation did not render its drag handle')
      await expect(handle).toBeVisible()
    }
    else if (handle) {
      await expect(handle).not.toBeVisible()
    }

    await userEvent.click(within(dialog).getByRole('button', { name: `Close ${presentation} presentation` }))
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  }
})

export const ContentAndActions = meta.story({
  name: '内容与操作区',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref(false)
      const result = ref('idle')
      const items = Array.from({ length: 12 }, (_, index) => `Review item ${index + 1}`)

      function show() {
        result.value = 'idle'
        open.value = true
      }

      function save() {
        result.value = 'saved'
        open.value = false
      }

      return { items, open, result, save, show }
    },
    template: `
      <main aria-label="Navigation Stack content" class="p-6">
        <Button @click="show">Review content</Button>
        <output class="sr-only" aria-live="polite" data-ui-navigation-content-result>{{ result }}</output>

        <NavigationStack
          :open="open"
          title="Review changes"
          page-key="review"
          close-label="Close review"
          @update:open="open = $event"
        >
          <section aria-label="Review items">
            <p>The content region keeps long page content separate from persistent actions.</p>
            <ul class="mt-4 grid gap-2">
              <li v-for="item in items" :key="item" class="rounded-field bg-base-200 px-3 py-2">
                {{ item }}
              </li>
            </ul>
          </section>

          <template #actions>
            <Button variant="ghost" @click="open = false">Cancel review</Button>
            <Button color="primary" @click="save">Save changes</Button>
          </template>
        </NavigationStack>
      </main>
    `,
  }),
})

ContentAndActions.test('renders caller-owned content and persistent actions', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Review content' }))

  const dialog = canvas.getByRole('dialog', { name: 'Review changes' })
  const content = within(dialog).getByRole('region', { name: 'Review items' })
  const cancel = within(dialog).getByRole('button', { name: 'Cancel review' })

  await expect(within(content).getAllByRole('listitem')).toHaveLength(12)
  await waitFor(() => expect(cancel).toBeVisible())
  await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(canvasElement.querySelector('[data-ui-navigation-content-result]')).toHaveTextContent('saved')
})

export const Navigation = meta.story({
  name: '方向导航',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref(false)
      const page = ref<'library' | 'details' | 'summary'>('library')
      const depth = computed(() => page.value === 'library' ? 0 : 1)
      const title = computed(() => ({
        details: 'Item details',
        library: 'Library',
        summary: 'Item summary',
      })[page.value])

      function show() {
        page.value = 'library'
        open.value = true
      }

      return { depth, open, page, show, title }
    },
    template: `
      <main aria-label="Navigation Stack direction" class="p-6">
        <Button @click="show">Open directional navigation</Button>

        <NavigationStack
          :open="open"
          :title="title"
          :page-key="page"
          :depth="depth"
          :can-go-back="page !== 'library'"
          back-label="Back to library"
          close-label="Close directional navigation"
          @update:open="open = $event"
          @back="page = 'library'"
        >
          <div v-if="page === 'library'" class="min-h-48 space-y-4">
            <p>Move deeper to create a forward transition.</p>
            <Button color="primary" @click="page = 'details'">Open item details</Button>
          </div>
          <div v-else-if="page === 'details'" class="min-h-64 space-y-4">
            <p>Replace this page without changing its depth.</p>
            <Button @click="page = 'summary'">Show item summary</Button>
          </div>
          <p v-else class="min-h-40">Return to the root to create a back transition.</p>
        </NavigationStack>
      </main>
    `,
  }),
})

Navigation.test('infers forward, replace, and back directions from page identity and depth', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Open directional navigation' }))

  let dialog = canvas.getByRole('dialog', { name: 'Library' })
  const stack = dialog.querySelector<HTMLElement>('[data-ui-navigation-stack]')

  if (!stack)
    throw new Error('Navigation Stack direction story did not render its stack')

  await userEvent.click(within(dialog).getByRole('button', { name: 'Open item details' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'forward')
  dialog = canvas.getByRole('dialog', { name: 'Item details' })
  await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Item details' })).toBeVisible())

  await userEvent.click(within(dialog).getByRole('button', { name: 'Show item summary' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'replace')
  dialog = canvas.getByRole('dialog', { name: 'Item summary' })
  await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Item summary' })).toBeVisible())

  await userEvent.click(within(dialog).getByRole('button', { name: 'Back to library' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'back')
  dialog = canvas.getByRole('dialog', { name: 'Library' })
  await waitFor(() => expect(within(dialog).getByRole('heading', { name: 'Library' })).toBeVisible())

  await userEvent.click(within(dialog).getByRole('button', { name: 'Close directional navigation' }))
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
})

export const Dismissal = meta.story({
  name: '关闭意图',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref(false)
      const reason = ref('idle')

      function show() {
        reason.value = 'idle'
        open.value = true
      }

      return { open, reason, show }
    },
    template: `
      <main aria-label="Navigation Stack dismissal" class="p-6">
        <Button @click="show">Open dismissal example</Button>
        <output class="sr-only" aria-live="polite" data-ui-navigation-dismiss>{{ reason }}</output>

        <NavigationStack
          :open="open"
          title="Dismissal example"
          page-key="dismissal"
          close-label="Close dismissal example"
          @update:open="open = $event"
          @dismiss="reason = $event"
        >
          <p>Close with the title-bar action, Escape, or the backdrop.</p>
        </NavigationStack>
      </main>
    `,
  }),
})

Dismissal.test('reports button, Escape, and backdrop dismissal while restoring focus', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open dismissal example' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-navigation-dismiss]')

  if (!result)
    throw new Error('Navigation Stack dismissal story did not render its outcome')

  trigger.focus()
  await userEvent.click(trigger)

  let dialog = canvas.getByRole('dialog', { name: 'Dismissal example' })

  await userEvent.click(within(dialog).getByRole('button', { name: 'Close dismissal example' }))
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('button')
  await expect(trigger).toHaveFocus()

  await userEvent.click(trigger)
  dialog = canvas.getByRole('dialog', { name: 'Dismissal example' })
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('escape')
  await expect(trigger).toHaveFocus()

  await userEvent.click(trigger)
  dialog = canvas.getByRole('dialog', { name: 'Dismissal example' })
  await userEvent.click(dialog)
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(result).toHaveTextContent('backdrop')
  await expect(trigger).toHaveFocus()
})
