import type { Preview } from '@storybook/vue3-vite'
import { OverlayHost } from '@115master/ui'
import { computed, watchEffect } from 'vue'
import '../src/styles/main.css'

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
      components: { OverlayHost, story },
      setup() {
        /** context.globals 是 reactive 对象，必须通过 computed 读取才能响应工具栏切换 */
        const theme = computed(() => (context.globals.theme === 'light' ? 'light' : 'dark'))
        /** 同步应用级历史 Teleport 的 Theme。 */
        watchEffect(() => {
          document.getElementById('my-app')?.setAttribute('data-theme', theme.value)
        })
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
          <OverlayHost>
            <story />
          </OverlayHost>
        </div>
      `,
    }),
  ],
}

export default preview
