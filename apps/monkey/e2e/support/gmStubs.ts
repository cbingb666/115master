/**
 * GM_* API 桩：以 addInitScript 注入，在 userscript 之前执行
 * - GM_getValue/GM_setValue 用 localStorage 持久化（跨导航保留）
 * - GM_xmlhttpRequest 用同源 fetch 实现，响应形状对齐 Tampermonkey
 * - unsafeWindow 直接指向页面 window（脚本本就注入页面上下文）
 */

/** 序列化初始 GM 值 */
function seed(values?: Record<string, unknown>) {
  return JSON.stringify(values ?? {})
}

/** GM 桩的 localStorage 持久化键（页面内外共享） */
export const GM_STORE_KEY = '__115master_e2e_gm_values__'

/** 生成注入脚本内容 */
export function gmInit(values?: Record<string, unknown>) {
  return `(() => {
  if (window.GM_xmlhttpRequest)
    return
  const STORE_KEY = '${GM_STORE_KEY}'
  const seed = ${seed(values)}
  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') ?? seed
    }
    catch {
      return seed
    }
  }
  const save = data => localStorage.setItem(STORE_KEY, JSON.stringify(data))
  if (!localStorage.getItem(STORE_KEY))
    save(seed)

  window.GM_getValue = (key, defaultValue) => {
    const data = load()
    return key in data ? data[key] : defaultValue
  }
  window.GM_setValue = (key, value) => {
    const data = load()
    data[key] = value
    save(data)
  }
  window.GM_deleteValue = (key) => {
    const data = load()
    delete data[key]
    save(data)
  }
  window.GM_listValues = () => Object.keys(load())

  window.GM_addStyle = (css) => {
    const el = document.createElement('style')
    el.textContent = css
    const parent = document.head ?? document.documentElement
    if (parent) {
      parent.appendChild(el)
      return el
    }
    // document-start 时根节点尚未解析，轮询等待可挂载节点
    const timer = setInterval(() => {
      const target = document.head ?? document.documentElement
      if (!target)
        return
      clearInterval(timer)
      target.appendChild(el)
    }, 0)
    return el
  }

  window.GM_xmlhttpRequest = (details) => {
    const controller = new AbortController()
    const timer = details.timeout
      ? setTimeout(() => controller.abort('timeout'), details.timeout)
      : null
    fetch(details.url, {
      method: details.method || 'GET',
      headers: details.headers,
      body: details.data,
      credentials: 'include',
      redirect: details.redirect === 'manual' ? 'manual' : 'follow',
      signal: controller.signal,
    })
      .then(async (res) => {
        if (timer)
          clearTimeout(timer)
        const headerLines = []
        res.headers.forEach((v, k) => headerLines.push(k + ': ' + v))
        let response
        if (details.responseType === 'json')
          response = await res.json()
        else if (details.responseType === 'blob')
          response = await res.blob()
        else if (details.responseType === 'arraybuffer')
          response = await res.arrayBuffer()
        else
          response = await res.text()
        details.onload?.({
          status: res.status,
          statusText: res.statusText,
          responseHeaders: headerLines.join('\\n'),
          response,
          responseText: typeof response === 'string' ? response : '',
          readyState: 4,
          finalUrl: res.url,
        })
      })
      .catch((err) => {
        if (timer)
          clearTimeout(timer)
        if (controller.signal.aborted) {
          if (controller.signal.reason === 'timeout') {
            details.ontimeout?.()
            return
          }
          details.onabort?.()
          return
        }
        details.onerror?.({ error: String(err) })
      })
    return { abort: () => controller.abort() }
  }

  const cookieCb = cb => cb?.(null)
  window.GM_cookie = {
    list: cb => cb?.([], null),
    set: (_details, cb) => cookieCb(cb),
    delete: (_details, cb) => cookieCb(cb),
  }

  window.GM_openInTab = (url) => {
    console.debug('[e2e] GM_openInTab:', url)
    return { closed: false, close() {}, onclose: null }
  }

  window.GM_notification = () => {}

  window.GM_info = {
    script: {
      name: '115Master',
      namespace: '115Master',
      version: '0.0.0-e2e',
      author: 'cbingb666',
      description: '115网盘脚本(e2e)',
      homepage: 'https://github.com/cbingb666/115master',
      supportURL: 'https://github.com/cbingb666/115master/issues',
    },
    scriptHandler: 'e2e',
    version: '1.0.0',
    userAgentData: navigator.userAgentData
      ? { platform: navigator.userAgentData.platform, brands: navigator.userAgentData.brands }
      : { platform: 'macOS', brands: [{ brand: 'Google Chrome', version: '131' }] },
  }

  window.unsafeWindow = window
})()`
}
