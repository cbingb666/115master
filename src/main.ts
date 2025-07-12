import globToRegex from 'glob-to-regexp'
import ROUTE_MATCH from './constants/route.match'
import HomePage from './pages/home/index'
import { magnetPage, registerMagnetProtocolHandler } from './pages/magnet'
import { videoPage, videoTokenPage } from './pages/video'
import { checkUserAgent } from './utils/checkUserAgent'
import { debugInfo } from './utils/debugInfo'

/** 调试信息 */
debugInfo.bootstrapInfo()

/** 检查用户代理 */
checkUserAgent()

/** 注册磁力链接协议处理程序 */
registerMagnetProtocolHandler()

/** 路由匹配 */
const routeMatch = [
  /** 首页 */
  {
    match: ROUTE_MATCH.HOME,
    exec: () => new HomePage(),
  },
  /** 视频页 */
  {
    match: ROUTE_MATCH.VIDEO,
    exec: () => videoPage(),
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
