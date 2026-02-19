import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from '@/app/routes'

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
