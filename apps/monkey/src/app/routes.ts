import type { RouteRecordRaw } from 'vue-router'

/** 路由配置 */
export const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    redirect: {
      name: 'drive',
      params: {
        cid: '0',
      },
    },
  },

  {
    name: 'drive',
    path: '/drive/:area?/:cid?',
    component: async () => import('../pages/drive/drive'),
  },

  {
    name: 'login',
    path: '/login',
    component: () => import('../pages/login/LoginPage'),
    beforeEnter: async (to) => {
      const guest = await import('./guest')
      return guest.guardLogin(to.query.redirect)
    },
  },

  {
    name: 'tags',
    path: '/tags',
    component: () => import('../pages/tags/tags'),
  },
  {
    name: 'video',
    path: '/video/:pickCode',
    component: () => import('../pages/video/index.vue'),
  },
  {
    name: 'test',
    path: '/test',
    component: () => import('../pages/test/TestPage'),
  },
]
