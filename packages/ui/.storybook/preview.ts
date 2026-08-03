import { ModalHost } from '@115master/ui'
import addonA11y from '@storybook/addon-a11y'
import addonDocs from '@storybook/addon-docs'
import addonVitest from '@storybook/addon-vitest'
import { definePreview } from '@storybook/vue3-vite'
import { computed } from 'vue'
import '@115master/ui/styles.css'

const preview = definePreview({
  addons: [
    addonDocs(),
    addonA11y(),
    addonVitest(),
  ],
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
      components: { ModalHost, story },
      setup() {
        const theme = computed(() => context.globals.theme === 'dark' ? 'dark' : 'light')
        return { theme }
      },
      template: '<div :data-theme="theme" data-ui-storybook-root><ModalHost><story /></ModalHost></div>',
    }),
  ],
})

export default preview
