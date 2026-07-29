import { createDialogService, DialogHost, OverlayHost } from '@115master/ui'
import { icons } from '@iconify-json/ion'
import { addCollection } from '@iconify/vue'
import addonDocs from '@storybook/addon-docs'
import addonVitest from '@storybook/addon-vitest'
import { definePreview } from '@storybook/vue3-vite'
import { computed, watchEffect } from 'vue'
import '../src/styles/main.css'

/** 本地预载 registry 使用的 Ion 集合，避免 Story 渲染时访问 Iconify API。 */
addCollection(icons)

/**
 * 应用仍有直接使用 #my-app 的历史 Teleport 集成；它不是 Tooltip 宿主。
 * Tooltip 由下方 Theme 范围内的 OverlayHost 解析最近目标。
 */
if (typeof document !== 'undefined' && !document.getElementById('my-app')) {
  const el = document.createElement('div')
  el.id = 'my-app'
  el.setAttribute('data-theme', 'dark')
  el.style.pointerEvents = 'none'
  document.body.appendChild(el)
}

const preview = definePreview({
  addons: [
    addonDocs(),
    addonVitest(),
  ],
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
      components: { DialogHost, OverlayHost, story },
      setup() {
        /** context.globals 是 reactive 对象，必须通过 computed 读取才能响应工具栏切换 */
        const theme = computed(() => (context.globals.theme === 'light' ? 'light' : 'dark'))
        /** 同步应用级历史 Teleport 的 Theme。 */
        watchEffect(() => {
          document.getElementById('my-app')?.setAttribute('data-theme', theme.value)
        })
        const dialog = createDialogService({
          messages: {
            confirm: '确认',
            cancel: '取消',
            inputLabel: '输入',
            requiredError: '此项为必填。',
          },
          onError: error => console.error(error),
        })
        return { dialog, theme }
      },
      template: `
        <div :data-theme="theme" class="app-bg-mesh bg-base-100 text-base-content min-h-screen p-8">
          <OverlayHost>
            <DialogHost :service="dialog">
              <story />
            </DialogHost>
          </OverlayHost>
        </div>
      `,
    }),
  ],
})

export default preview
