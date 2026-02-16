/* eslint-disable perfectionist/sort-imports */
import '@115master/shared/115polyfills'

import globToRegex from 'glob-to-regexp'
import { createMasterApp } from './app/index'
import ROUTE_MATCH from './constants/route.match'
import HomePage from './pages/home/index'
import { magnetPage, registerMagnetProtocolHandler } from './pages/magnet'
import { videoTokenPage } from './pages/video'
import { checkUserAgent } from './utils/checkUserAgent'
import { debugInfo } from './utils/debugInfo'

/** 设置 document.domain 以支持 115 Bridge 跨域通信 */
/** 必须在任何代码执行之前设置 */
try {
  if (document.domain && document.domain.endsWith('115.com')) {
    document.domain = '115.com'
  }
}
catch (error) {
  // 某些浏览器可能不允许设置 domain
  console.warn('[115Master] Failed to set document.domain:', error)
}

/** 调试信息 */
debugInfo.bootstrapInfo()

/** 检查用户代理 */
checkUserAgent()

/** 注册磁力链接协议处理程序 */
registerMagnetProtocolHandler()

/** 路由匹配 */
const routeMatch = [
  /** 官方首页 */
  {
    match: ROUTE_MATCH.HOME,
    exec: () => new HomePage(),
  },
  /** 网盘首页 */
  {
    match: ROUTE_MATCH.MASTER,
    exec: () => createMasterApp(),
  },
  /** 视频页（token中转） */
  {
    match: ROUTE_MATCH.VIDEO_TOKEN,
    exec: () => videoTokenPage(),
  },
  /** 磁力链接页 */
  {
    match: ROUTE_MATCH.MAGNET,
    exec: () => magnetPage(),
  },
]

/** 主函数 */
function main() {
  for (const route of routeMatch) {
    if (globToRegex(route.match).test(window.location.href)) {
      route.exec()
    }
  }
}

/** 文档加载完成 */
if (
  document.readyState === 'complete'
  || document.readyState === 'interactive'
) {
  main()
}
else {
  window.addEventListener('DOMContentLoaded', main)
}
