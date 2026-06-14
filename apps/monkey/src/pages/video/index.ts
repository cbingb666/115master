import { GM_cookie } from '$'
import { Share } from '@115master/drive115'

export function setVideoCookie(cookieDetail: Parameters<typeof GM_cookie.set>[0] & {
  sameSite: 'no_restriction'
}) {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.src = `${Share.CONSTANT.URL_115.DL}/video/token`
    iframe.style.display = 'none'
    window.addEventListener('message', (event) => {
      if (event.origin === Share.CONSTANT.URL_115.DL && event.data.event === 'ready') {
        iframe.contentWindow?.postMessage(
          {
            event: 'set-cookies',
            data: cookieDetail,
          },
          Share.CONSTANT.URL_115.DL,
        )
      }

      if (
        event.origin === Share.CONSTANT.URL_115.DL
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
    Share.CONSTANT.URL_115.NORMAL,
  )
  window.addEventListener('message', (event) => {
    if (event.origin === Share.CONSTANT.URL_115.NORMAL && event.data.event === 'set-cookies') {
      GM_cookie.set(event.data.data, (error) => {
        window.parent.postMessage(
          {
            event: 'set-cookies-callback',
            data: error,
          },
          Share.CONSTANT.URL_115.NORMAL,
        )
      })
    }
  })
}
