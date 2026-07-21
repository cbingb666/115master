import type { Preview } from '@storybook/vue3-vite'
import { computed, watchEffect } from 'vue'
import '../src/styles/main.css'

/**
 * 在 document 级创建 #my-app（Vue mount 之前就存在），供组件的 `Teleport to="#my-app"` 使用。
 * monkey 环境里 #my-app 是脚本挂载点（mount 前由脚本创建）；storybook 里若把 #my-app 放进
 * Vue 渲染树，组件挂载阶段整棵树尚未 insert 到 document，Teleport 会找不到 target。
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
      components: { story },
      setup() {
        /** context.globals 是 reactive 对象，必须通过 computed 读取才能响应工具栏切换 */
        const theme = computed(() => (context.globals.theme === 'light' ? 'light' : 'dark'))
        /** 同步主题到 document 级 #my-app，让 Teleport 进去的 tooltip 也跟随主题 */
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
          <story />
        </div>
      `,
    }),
  ],
}

export default preview
