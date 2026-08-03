import type { ScrollbarSize } from '@115master/ui'
import { scrollbar } from '@115master/ui'
import preview from '../../.storybook/preview'

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const satisfies readonly ScrollbarSize[]

const meta = preview.type<{
  args: {
    size: ScrollbarSize
  }
}>().meta({
  title: 'UI/Scrollbar',
  args: {
    size: 'md',
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: sizes,
      description: '原生滚动条沿滚动轴占用的视觉尺寸。',
    },
  },
  render: args => ({
    setup: () => ({ args, scrollbar }),
    template: `
      <main aria-label="Default Scrollbar" class="p-6">
        <div
          :class="scrollbar(args.size)"
          aria-label="Scrollable items"
          class="h-56 max-w-md overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-4"
          role="region"
          tabindex="0"
        >
          <ol class="grid gap-3">
            <li
              v-for="item in 12"
              :key="item"
              class="rounded-field bg-base-100 px-4 py-3"
            >
              Item {{ item }}
            </li>
          </ol>
        </div>
      </main>
    `,
  }),
  parameters: {
    docs: {
      description: {
        component:
          'Scrollbar 保留浏览器原生滚动交互，并为单个滚动容器或整个子树提供主题感知的沉浸式轨道；它只负责样式，不提供自定义拖拽实现。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Sizes = meta.story({
  name: '尺寸',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    setup: () => ({ scrollbar, sizes }),
    template: `
      <main aria-label="Scrollbar sizes" class="grid gap-5 p-6 sm:grid-cols-2 xl:grid-cols-5">
        <article v-for="size in sizes" :key="size" class="grid gap-2">
          <h2 class="text-sm font-semibold uppercase">{{ size }}</h2>
          <div
            :class="scrollbar(size)"
            :aria-label="size + ' scrollbar'"
            class="h-44 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="grid gap-2">
              <li
                v-for="item in 10"
                :key="item"
                class="rounded-field bg-base-100 px-3 py-2"
              >
                Item {{ item }}
              </li>
            </ol>
          </div>
        </article>
      </main>
    `,
  }),
})

export const OverflowAxes = meta.story({
  name: '滚动轴',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    setup: () => ({ scrollbar }),
    template: `
      <main aria-label="Scrollbar overflow axes" class="grid gap-6 p-6 md:grid-cols-2">
        <article class="grid gap-2">
          <h2 class="text-sm font-semibold">Vertical overflow</h2>
          <div
            :class="scrollbar()"
            aria-label="Vertical scrolling"
            class="h-52 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="grid gap-2">
              <li
                v-for="item in 12"
                :key="item"
                class="rounded-field bg-base-100 px-3 py-2"
              >
                Row {{ item }}
              </li>
            </ol>
          </div>
        </article>

        <article class="grid gap-2">
          <h2 class="text-sm font-semibold">Horizontal overflow</h2>
          <div
            :class="scrollbar()"
            aria-label="Horizontal scrolling"
            class="h-52 overflow-x-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="flex w-max gap-3">
              <li
                v-for="item in 8"
                :key="item"
                class="grid h-40 w-36 place-items-center rounded-field bg-base-100 px-3 py-2"
              >
                Column {{ item }}
              </li>
            </ol>
          </div>
        </article>
      </main>
    `,
  }),
})

export const ApplicationScope = meta.story({
  name: '应用范围',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    setup: () => ({ scrollbar }),
    template: `
      <main aria-label="Scrollbar application scope" class="grid gap-6 p-6 md:grid-cols-2">
        <article class="grid gap-2">
          <h2 class="text-sm font-semibold">Single container</h2>
          <div
            :class="scrollbar()"
            aria-label="Directly styled scrolling"
            class="h-52 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="grid gap-2">
              <li
                v-for="item in 10"
                :key="item"
                class="rounded-field bg-base-100 px-3 py-2"
              >
                Item {{ item }}
              </li>
            </ol>
          </div>
        </article>

        <article :class="scrollbar()" class="grid gap-2">
          <h2 class="text-sm font-semibold">Shared root</h2>
          <div
            aria-label="Inherited scrolling"
            class="h-52 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="grid gap-2">
              <li
                v-for="item in 10"
                :key="item"
                class="rounded-field bg-base-100 px-3 py-2"
              >
                Item {{ item }}
              </li>
            </ol>
          </div>
        </article>
      </main>
    `,
  }),
})

export const TrackInsets = meta.story({
  name: '轨道内缩',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    setup: () => ({ scrollbar }),
    template: `
      <main aria-label="Scrollbar track insets" class="grid gap-6 p-6 md:grid-cols-2">
        <article class="grid gap-2">
          <h2 class="text-sm font-semibold">Default inset</h2>
          <div
            :class="scrollbar()"
            aria-label="Default track inset"
            class="h-56 overflow-y-scroll rounded-box border border-base-content/15 bg-base-200 p-3"
            role="region"
            tabindex="0"
          >
            <ol class="grid gap-2">
              <li
                v-for="item in 12"
                :key="item"
                class="rounded-field bg-base-100 px-3 py-2"
              >
                Item {{ item }}
              </li>
            </ol>
          </div>
        </article>

        <article class="grid gap-2">
          <h2 class="text-sm font-semibold">Floating header and footer</h2>
          <div class="relative h-56 overflow-hidden rounded-box border border-base-content/15 bg-base-200">
            <div
              :class="scrollbar()"
              aria-label="Scrolling below floating content"
              class="absolute inset-0 overflow-y-scroll px-3 py-16"
              role="region"
              style="--ui-scrollbar-track-inset-start: 4rem; --ui-scrollbar-track-inset-end: 4rem"
              tabindex="0"
            >
              <ol class="grid gap-2">
                <li
                  v-for="item in 12"
                  :key="item"
                  class="rounded-field bg-base-100 px-3 py-2"
                >
                  Item {{ item }}
                </li>
              </ol>
            </div>
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-x-0 top-0 flex h-14 items-center border-b border-base-content/10 bg-base-100/95 px-4 font-semibold"
            >
              Floating header
            </div>
            <div
              aria-hidden="true"
              class="pointer-events-none absolute inset-x-0 bottom-0 flex h-14 items-center border-t border-base-content/10 bg-base-100/95 px-4 text-sm"
            >
              Floating footer
            </div>
          </div>
        </article>
      </main>
    `,
  }),
})
