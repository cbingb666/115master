import type { RouteRecordRaw } from 'vue-router'

/** 路由配置 */
export const routes: RouteRecordRaw[] = [
  {
    name: 'home',
    path: '/',
    redirect: {
      name: 'drive',
      params: {
        area: 'all',
        cid: '0',
      },
    },
  },

  {
    name: 'drive',
    path: '/drive/:area?/:cid?',
    component: async () => import('../pages/drive/drive'),
    meta: {
      keepAlive: true,
    },
  },
  {
    name: 'video',
    path: '/video/:pickCode',
    component: () => import('../pages/video/index.vue'),
  },
]
