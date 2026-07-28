import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Button, createDialogService, DialogHost } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createAppDialogService } from './dialogAdapter'
import { dialogMarker, instrumentDialogRouter } from './testing/dialogRouter'

const meta = {
  title: 'App/Dialog history adapter',
  parameters: {
    docs: {
      description: {
        component:
          'Monkey 使用内存 Router 组合公共 Dialog service，验证嵌套 history、浏览器后退和前向业务路由的应用边界。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const NestedAndForwardNavigation: Story = {
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const source = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/', component: { render: () => null } },
          { path: '/tags', component: { render: () => null } },
        ],
      })
      const listeners = ref(0)
      const failure = ref('none')
      const parentResult = ref('idle')
      const childResult = ref('idle')
      const observed = instrumentDialogRouter(source, (count) => {
        listeners.value = count
      })
      const router = observed.router
      const dialog = createAppDialogService(
        createDialogService({
          messages: {
            confirm: '确认',
            cancel: '取消',
            inputLabel: '输入',
            requiredError: '此项为必填。',
          },
          onError: (cause) => {
            failure.value = cause instanceof Error ? cause.message : String(cause)
          },
        }),
        router,
        (cause) => {
          failure.value = cause instanceof Error ? cause.message : String(cause)
        },
      )
      const route = computed(() => {
        return `${source.currentRoute.value.path}:${dialogMarker(source) ?? 'none'}`
      })
      const openParent = () => {
        parentResult.value = 'idle'
        const handle = dialog.create({
          title: 'History parent',
          content: 'The parent remains active while its child marker is current.',
          history: true,
        })

        void handle.closed.then((outcome) => {
          parentResult.value = outcome.reason
        })
      }
      const openChild = () => {
        childResult.value = 'idle'
        const handle = dialog.create({
          title: 'History child',
          content: 'Back closes this child before its parent.',
          history: true,
        })

        void handle.closed.then((outcome) => {
          childResult.value = outcome.reason
        })
      }

      void source.push('/')

      return {
        childResult,
        dialog,
        failure,
        listeners,
        openChild,
        openParent,
        parentResult,
        route,
        router,
      }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog history integration" class="flex flex-wrap gap-3 p-6">
          <Button @click="openParent">Open history parent</Button>
          <Button @click="openChild">Open history child</Button>
          <Button @click="router.back()">Back route</Button>
          <Button @click="router.push('/tags')">Navigate to tags</Button>
          <output aria-live="polite" data-dialog-history-route>{{ route }}</output>
          <output aria-live="polite" data-dialog-history-parent>{{ parentResult }}</output>
          <output aria-live="polite" data-dialog-history-child>{{ childResult }}</output>
          <output aria-live="polite" data-dialog-history-listeners>{{ listeners }}</output>
          <output aria-live="polite" data-dialog-history-error>{{ failure }}</output>
        </main>
      </DialogHost>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const route = canvasElement.querySelector<HTMLOutputElement>('[data-dialog-history-route]')
    const parent = canvasElement.querySelector<HTMLOutputElement>('[data-dialog-history-parent]')
    const child = canvasElement.querySelector<HTMLOutputElement>('[data-dialog-history-child]')
    const listeners = canvasElement.querySelector<HTMLOutputElement>('[data-dialog-history-listeners]')

    if (!route || !parent || !child || !listeners)
      throw new Error('Dialog history integration outputs are missing')

    await waitFor(() => expect(route).toHaveTextContent('/:none'))
    await userEvent.click(canvas.getByRole('button', { name: 'Open history parent' }))
    await waitFor(() => expect(route.textContent?.startsWith('/:dialog-')).toBe(true))
    const parentMarker = route.textContent

    await userEvent.click(canvas.getByRole('button', { name: 'Open history child' }))
    await waitFor(() => expect(route.textContent).not.toBe(parentMarker))
    await expect(canvasElement.querySelectorAll('dialog[open]')).toHaveLength(2)
    await expect(parent).toHaveTextContent('idle')

    await userEvent.click(canvas.getByRole('button', { name: 'Back route' }))
    await waitFor(() => expect(child).toHaveTextContent('programmatic'))
    await waitFor(() => expect(route).toHaveTextContent(parentMarker ?? ''))
    await expect(canvasElement.querySelectorAll('dialog[open]')).toHaveLength(1)
    await expect(parent).toHaveTextContent('idle')

    await userEvent.click(canvas.getByRole('button', { name: 'Back route' }))
    await waitFor(() => expect(parent).toHaveTextContent('programmatic'))
    await waitFor(() => expect(listeners).toHaveTextContent('0'))

    await userEvent.click(canvas.getByRole('button', { name: 'Open history parent' }))
    await waitFor(() => expect(route.textContent?.startsWith('/:dialog-')).toBe(true))
    const staleMarker = route.textContent

    await userEvent.click(canvas.getByRole('button', { name: 'Navigate to tags' }))
    await waitFor(() => expect(route).toHaveTextContent('/tags:none'))
    await waitFor(() => expect(parent).toHaveTextContent('programmatic'))
    await expect(listeners).toHaveTextContent('0')

    await userEvent.click(canvas.getByRole('button', { name: 'Back route' }))
    await waitFor(() => expect(route).toHaveTextContent(staleMarker ?? ''))
    await expect(canvasElement.querySelectorAll('dialog[open]')).toHaveLength(0)
    await expect(listeners).toHaveTextContent('0')
  },
}
