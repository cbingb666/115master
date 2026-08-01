import { Button, NavigationStack } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { computed, ref } from 'vue'
import preview from '../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/NavigationStack',
  component: NavigationStack,
  parameters: {
    docs: {
      description: {
        component:
          '受控的临时导航栈。移动端呈现为全屏页面，桌面端呈现为 Dialog，并依据页面标识与层级自动生成方向感知转场。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Navigation = meta.story({
  name: '导航与自适应呈现',
  render: () => ({
    components: { Button, NavigationStack },
    setup() {
      const open = ref(false)
      const page = ref<'library' | 'details'>('library')
      const title = computed(() => page.value === 'library' ? '媒体库' : '项目详情')
      const reason = ref('idle')

      function show() {
        page.value = 'library'
        reason.value = 'idle'
        open.value = true
      }

      return { open, page, reason, show, title }
    },
    template: `
      <main aria-label="Navigation Stack" class="p-6">
        <Button @click="show">打开导航栈</Button>
        <output class="sr-only" aria-live="polite" data-ui-navigation-dismiss>{{ reason }}</output>

        <NavigationStack
          :open="open"
          :title="title"
          :page-key="page"
          :depth="page === 'details' ? 1 : 0"
          :can-go-back="page === 'details'"
          back-label="返回媒体库"
          close-label="关闭导航栈"
          @update:open="open = $event"
          @back="page = 'library'"
          @dismiss="reason = $event"
        >
          <div class="min-h-72">
            <div v-if="page === 'library'" class="space-y-4">
              <p>从列表进入临时工作流的下一层。</p>
              <Button color="primary" @click="page = 'details'">打开项目详情</Button>
            </div>
            <p v-else>详情页通过统一导航栏返回，不自行绘制返回按钮。</p>
          </div>
        </NavigationStack>
      </main>
    `,
  }),
})

Navigation.test('proves navigation, dismissal, focus, and responsive presentation', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: '打开导航栈' })

  trigger.focus()
  await userEvent.click(trigger)

  let dialog = canvas.getByRole('dialog', { name: '媒体库' })
  const stack = dialog.querySelector<HTMLElement>('[data-ui-navigation-stack]')

  if (!stack)
    throw new Error('NavigationStack did not render its public stack marker.')

  await waitFor(() => expect(canvas.getByRole('heading', { name: '媒体库' })).toBeVisible())

  if (window.matchMedia('(width < 40rem)').matches) {
    const rect = stack.getBoundingClientRect()

    expect(rect.width).toBeGreaterThanOrEqual(window.innerWidth - 1)
    expect(rect.height).toBeGreaterThanOrEqual(window.innerHeight - 1)
  }
  else {
    expect(stack.getBoundingClientRect().width).toBeLessThan(window.innerWidth)
  }

  await userEvent.click(canvas.getByRole('button', { name: '打开项目详情' }))

  dialog = canvas.getByRole('dialog', { name: '项目详情' })
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'forward')
  await waitFor(() => expect(within(dialog).getByRole('heading', { name: '项目详情' })).toBeVisible())
  await userEvent.click(within(dialog).getByRole('button', { name: '返回媒体库' }))
  await expect(stack).toHaveAttribute('data-ui-navigation-direction', 'back')
  dialog = canvas.getByRole('dialog', { name: '媒体库' })
  await waitFor(() => expect(within(dialog).getByRole('heading', { name: '媒体库' })).toBeVisible())

  await userEvent.click(canvas.getByRole('button', { name: '关闭导航栈' }))
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(trigger).toHaveFocus()
  await expect(canvasElement.querySelector('[data-ui-navigation-dismiss]')).toHaveTextContent('button')
})
