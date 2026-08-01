import { Watermark } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const meta = preview.meta({
  title: 'UI/Watermark',
  component: Watermark,
  args: {
    content: '115Master Preview',
    color: '#64748b',
    opacity: 0.18,
    fontSize: 16,
    fontFamily: 'system-ui, sans-serif',
    fontWeight: 500,
    rotate: -22,
    gap: [96, 72],
    offset: [0, 0],
  },
  parameters: {
    docs: {
      description: {
        component: '覆盖内容区域的装饰性重复文本水印；不拦截指针或辅助技术，也不应被视为数据保护边界。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Contract = meta.story({
  name: '重复铺陈与内容交互',
  args: {
    content: '115Master Preview',
  },
  render: args => ({
    components: { Watermark },
    setup() {
      const actions = ref(0)
      const act = () => actions.value += 1

      return { actions, args, act }
    },
    template: `
      <main aria-label="Watermark contract" class="grid gap-6 p-6 lg:grid-cols-2">
        <Watermark v-bind="args" class="overflow-hidden rounded-box border border-base-300 bg-base-100">
          <article class="grid min-h-80 content-between gap-8 p-8">
            <div class="grid gap-3">
              <p class="text-sm font-semibold text-primary">SHARED DOCUMENT</p>
              <h1 class="text-3xl font-bold">Quarterly workspace</h1>
              <p class="max-w-md text-base-content/70">
                水印覆盖整个容器，同时底层内容仍保持可读与可交互。
              </p>
            </div>
            <div class="flex items-center gap-3">
              <button type="button" class="btn btn-primary" @click="act">测试内容交互</button>
              <output aria-live="polite" data-ui-watermark-actions>{{ actions }}</output>
            </div>
          </article>
        </Watermark>

        <Watermark
          :content="['CONFIDENTIAL', 'preview@example.com']"
          color="#7c3aed"
          :font-size="14"
          :font-weight="600"
          :gap="[72, 52]"
          :offset="[24, 18]"
          :rotate="-16"
          class="overflow-hidden rounded-box border border-base-300 bg-base-200"
        >
          <article class="grid min-h-80 place-content-center gap-3 p-8 text-center">
            <p class="text-sm font-semibold text-secondary">MULTI-LINE</p>
            <h2 class="text-2xl font-bold">可识别的分享副本</h2>
            <p class="max-w-sm text-base-content/70">多行身份信息与自定义间距、偏移、字号和旋转角度。</p>
          </article>
        </Watermark>
      </main>
    `,
  }),
})

Contract.test('proves repeated decoration and content interaction', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const roots = canvasElement.querySelectorAll<HTMLElement>('[data-ui-watermark]')
  const marks = canvasElement.querySelectorAll<HTMLElement>('[data-ui-watermark-mark]')
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-watermark-actions]')

  if (!actions)
    throw new Error('Watermark contract story did not render its observable outcome')

  await expect(roots).toHaveLength(2)
  await expect(marks).toHaveLength(2)
  await expect(marks[0]).toHaveAttribute('aria-hidden', 'true')
  await expect(marks[0]).toHaveStyle({
    backgroundRepeat: 'repeat',
    pointerEvents: 'none',
  })
  await expect(marks[0].style.getPropertyValue('--ui-watermark-image')).toContain('data:image/svg+xml')
  await expect(marks[1].style.getPropertyValue('--ui-watermark-image')).not.toEqual(
    marks[0].style.getPropertyValue('--ui-watermark-image'),
  )

  await userEvent.click(canvas.getByRole('button', { name: '测试内容交互' }))
  await expect(actions).toHaveTextContent('1')
})
