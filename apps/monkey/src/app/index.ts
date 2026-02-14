import { GM_addStyle } from '$'
import { createApp, defineAsyncComponent } from 'vue'
import { router } from '@/app/router'
import mainStyles from '@/styles/main.css?inline'

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
  // 重置 body 样式
  document.body.style.backgroundColor = '#000'
  document.body.style.margin = '0'
  /** 设置移动端响应式 */
  const createMeta = document.createElement('meta')
  createMeta.name = 'viewport'
  createMeta.content = 'width=device-width,initial-scale=1'
  document.head.append(createMeta)

  // 设置根元素
  document.body.innerHTML = `<div id="my-app" data-theme="dark"></div>`
  document.title = ''

  // fix scrollbar 在主页下丢失，因为 vite-plugin-monkey 的 css 处理会造成全局污染
  GM_addStyle(`
      ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        /* display: none !important; */
      }
  
      ::-webkit-scrollbar-track {
        background: transparent;
      }
  
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
      }
  
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
  
      /* 隐藏滚动条 */
      :fullscreen html::-webkit-scrollbar,
      :fullscreen body::-webkit-scrollbar {
        width: 0 !important;
        height: 0 !important;
        display: none !important
      }
    `)
}
