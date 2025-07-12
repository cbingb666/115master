import type { DownloadResult } from './drive115/core'
/**
 * 使用 shortcuts 打开 mpv 播放网页
 */
export function webLinkShortcutsMpv(downloadResult: DownloadResult) {
  const shell = {
    bin: '/opt/homebrew/bin/mpv',
    url: downloadResult.url.url,
    userAgent: navigator.userAgent,
  }
  return `shortcuts://run-shortcut?name=115MasterWebLink&input=text&text=${encodeURIComponent(
    JSON.stringify(shell),
  )}`
}

/**
 * 使用 iina 打开网页
 */
export function webLinkIINA(downloadResult: DownloadResult) {
  return `iina://weblink?url=${encodeURIComponent(downloadResult.url.url)}&mpv_http-header-fields=${encodeURIComponent(
    `User-Agent: ${navigator.userAgent.replace(',', '\\,')},Cookie: ${downloadResult.url.auth_cookie?.name}=${downloadResult.url.auth_cookie?.value}`,
  )}`
}
