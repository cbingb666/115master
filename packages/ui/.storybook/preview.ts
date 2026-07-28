import type { Preview } from '@storybook/vue3-vite'
import { computed } from 'vue'
import '@115master/ui/styles.css'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      disable: true,
    },
    a11y: {
      test: 'error',
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'UI 基础主题',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (story, context) => ({
      components: { story },
      setup() {
        const theme = computed(() => context.globals.theme === 'dark' ? 'dark' : 'light')
        return { theme }
      },
      template: '<div :data-theme="theme" data-ui-storybook-root><story /></div>',
    }),
  ],
}

export default preview
