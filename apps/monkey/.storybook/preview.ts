import type { Preview } from '@storybook/vue3-vite'
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
    (story, context) => {
      const theme = context.globals.theme === 'light' ? 'light' : 'dark'
      return {
        components: { story },
        setup: () => ({ theme }),
        template: `
          <div
            :data-theme="theme"
            class="app-bg-mesh"
            :style="{
              backgroundColor: theme === 'light' ? '#fff' : '#000',
              color: theme === 'light' ? 'oklch(23.2% 0.004 286.1)' : 'oklch(97.1% 0.003 286.4)',
              minHeight: '100vh',
              padding: '2rem',
            }"
          >
            <story />
          </div>
        `,
      }
    },
  ],
}

export default preview
