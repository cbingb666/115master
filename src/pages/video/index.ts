import { GM_addStyle, GM_cookie } from '$'
import { createApp, defineAsyncComponent } from 'vue'
import { DL_URL_115, NORMAL_URL_115 } from '../../constants/115'
import mainStyles from '../../styles/main.css?inline'

function resetDocument() {
  document.body.style.backgroundColor = '#000'
  document.body.style.margin = '0'
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

export function setVideoCookie(cookieDetail: Parameters<typeof GM_cookie.set>[0] & {
  sameSite: 'no_restriction'
}) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.src = `${DL_URL_115}/video/token`
    iframe.style.display = 'none'
    window.addEventListener('message', (event) => {
      if (event.origin === DL_URL_115 && event.data.event === 'ready') {
        iframe.contentWindow?.postMessage(
          {
            event: 'set-cookies',
            data: cookieDetail,
          },
          DL_URL_115,
        )
      }

      if (
        event.origin === DL_URL_115
        && event.data.event === 'set-cookies-callback'
      ) {
        if (event.data.data) {
          reject(event.data.data)
        }
        else {
          resolve('success')
        }
        iframe.remove()
      }
    })
    document.body.appendChild(iframe)
  })
}

export function videoTokenPage() {
  window.parent.postMessage(
    {
      event: 'ready',
    },
    NORMAL_URL_115,
  )
  window.addEventListener('message', (event) => {
    if (event.origin === NORMAL_URL_115 && event.data.event === 'set-cookies') {
      GM_cookie.set(event.data.data, (error) => {
        window.parent.postMessage(
          {
            event: 'set-cookies-callback',
            data: error,
          },
          NORMAL_URL_115,
        )
      })
    }
  })
}

export async function videoPage() {
  resetDocument()
  const style = document.createElement('style')
  style.textContent = mainStyles
  style.dataset.v = 'style_css'
  if (import.meta.hot) {
    import.meta.hot.accept('../../styles/main.css?inline', (newModule) => {
      style.textContent = newModule?.default || ''
    })
  }
  document.head.append(style)

  createApp(
    defineAsyncComponent({
      loader: () => import('./index.vue'),
    }),
  ).mount('#my-app')
}
