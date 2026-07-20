import type { Preview } from '@storybook/vue3-vite'
import { computed } from 'vue'
import '../src/styles/main.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      disable: true,
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: '全局主题',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        /** context.globals 是 reactive 对象，必须通过 computed 读取才能响应工具栏切换 */
        const theme = computed(() => (context.globals.theme === 'light' ? 'light' : 'dark'))
        const style = computed(() => ({
          backgroundColor: theme.value === 'light' ? '#fff' : '#000',
          color: theme.value === 'light' ? 'oklch(23.2% 0.004 286.1)' : 'oklch(97.1% 0.003 286.4)',
          minHeight: '100vh',
          padding: '2rem',
        }))
        return { theme, style }
      },
      template: `
        <div :data-theme="theme" class="app-bg-mesh" :style="style">
          <story />
        </div>
      `,
    }),
  ],
}

export default preview
