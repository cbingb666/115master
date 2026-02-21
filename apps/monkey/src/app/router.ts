import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '@/app/routes'
import { MASTER_BASE_URL } from '@/constants'

/** 兼容旧版播放页地址重定向（在 router 创建前执行） */
/** e.g. /master/video/?pick_code=xxx → /master/#/video/xxx */
function legacyRedirect() {
  if (!window.location.pathname.includes('/master/video'))
    return
  const pickCode = new URLSearchParams(window.location.search).get('pick_code')
  if (!pickCode)
    return
  history.replaceState(null, '', `${MASTER_BASE_URL}/#/video/${pickCode}`)
}

legacyRedirect()

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: async (to, _from, savedPosition) => {
    /** drive 路由由页面自己管理滚动位置 */
    if (to.name === 'drive')
      return false
    if (savedPosition)
      return savedPosition
    return { top: 0 }
  },
})
