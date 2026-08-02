import { scrollbar } from '@115master/ui'
import { createApp, defineAsyncComponent } from 'vue'
import { router } from '@/app/router'
import logoSvgUrl from '@/assets/logo.svg?url'
import mainStyles from '@/styles/main.css?inline'
import { initTheme, setThemeMode } from '@/utils/theme'
import { userSettings } from '@/utils/userSettings'

/**
 * 创建应用
 */
export async function createMasterApp() {
  resetDocument()
  const style = document.createElement('style')
  style.textContent = mainStyles
  style.dataset.v = 'style_css'
  if (import.meta.hot) {
    import.meta.hot.accept('../styles/main.css?inline', (newModule) => {
      style.textContent = newModule?.default || ''
    })
  }
  document.head.append(style)

  // 用持久化的主题模式驱动 theme.ts，再由 theme.ts 把 data-theme 写到 #my-app
  setThemeMode(userSettings.value.theme)
  initTheme()
  // 用户切换设置 → 同步到主题模块
  userSettings.watch('theme', (_, next) => setThemeMode(next))
  // theme.ts 内部解析后回填（system 模式下系统主题变化会改 resolvedTheme，不必同步到 userSettings）

  const app = createApp(defineAsyncComponent({
    loader: () => import('./app'),
  }))
  app.use(router)
  app.use(await import('pinia').then(m => m.createPinia()))
  app.mount('#my-app')
}

/**
 * 重置文档
 */
function resetDocument() {
  document.documentElement.classList.add(...scrollbar('sm'))

  // 替换页面 favicon 为 master logo
  document.querySelectorAll('link[rel*="icon"]').forEach(el => el.remove())
  const icon = document.createElement('link')
  icon.rel = 'icon'
  icon.type = 'image/svg+xml'
  icon.href = logoSvgUrl
  document.head.append(icon)

  // 重置 body 样式（背景由 #my-app 渲染，避免挂载前出现白闪）
  document.body.style.backgroundColor = 'transparent'
  document.body.style.margin = '0'
  /** 设置移动端响应式 */
  const createMeta = document.createElement('meta')
  createMeta.name = 'viewport'
  createMeta.content = 'width=device-width,initial-scale=1'
  document.head.append(createMeta)

  // 设置根元素，初始 data-theme 与背景色由 initTheme() 写入
  document.body.innerHTML = `<div id="my-app" data-theme="dark" style="min-height:100vh"></div>`
  document.title = ''
}
