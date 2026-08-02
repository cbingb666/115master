import type { ScrollbarSize } from '@115master/ui'
import { scrollbar } from '@115master/ui'
import { expect } from 'storybook/test'
import preview from '../../.storybook/preview'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const satisfies readonly ScrollbarSize[]
const widths: Record<ScrollbarSize, string> = {
  xs: '4px',
  sm: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
}

const meta = preview.meta({
  title: 'UI/Scrollbar',
  parameters: {
    docs: {
      description: {
        component: '基于原生滚动行为的沉浸式滚动条样式模块；scrollbar(size) 可应用到单个滚动容器或拥有多个滚动区域的根容器。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Sizes = meta.story({
  name: '尺寸',
  render: () => ({
    setup() {
      return { scrollbar, sizes }
    },
    template: `
      <main aria-label="Scrollbar sizes" class="grid gap-5 p-6 sm:grid-cols-2 xl:grid-cols-5">
        <article
          v-for="size in sizes"
          :key="size"
          :class="scrollbar(size)"
          class="grid gap-2"
        >
          <h2 class="text-sm font-semibold uppercase">{{ size }}</h2>
          <div
            :data-ui-scrollbar-size="size"
            :aria-label="size + ' scrollbar demo'"
            class="h-44 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            tabindex="0"
          >
            <p v-for="item in 12" :key="item" class="mb-2 rounded-field bg-base-100 px-3 py-2">
              Item {{ item }}
            </p>
          </div>
        </article>
      </main>
    `,
  }),
})

Sizes.test('proves the public size scale and root-container inheritance', async ({ canvasElement }) => {
  const elements = Array.from(canvasElement.querySelectorAll<HTMLElement>('[data-ui-scrollbar-size]'))

  await expect(elements).toHaveLength(sizes.length)

  for (const element of elements) {
    const size = element.dataset.uiScrollbarSize as ScrollbarSize
    const root = element.closest('.ui-scrollbar')
    const track = getComputedStyle(element, '::-webkit-scrollbar-track')

    await expect(root).toHaveClass('ui-scrollbar', `ui-scrollbar-${size}`)
    await expect(getComputedStyle(element, '::-webkit-scrollbar').width).toBe(widths[size])
    await expect(track.marginBlockStart).toBe('24px')
    await expect(track.marginBlockEnd).toBe('24px')
  }
})
