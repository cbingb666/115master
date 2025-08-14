/**
 * 路由类型
 * @see https://router.vuejs.org/guide/advanced/typed-routes
 */

import type { RouteRecordInfo } from 'vue-router'

export interface RouteNamedMap {
  /** 网盘页 */
  drive: RouteRecordInfo<
      'drive',
      '/drive/:area?/:cid?',
      {
        area?: 'all' | 'recent' | 'trash' | 'star' | 'share'
        cid: string
      },
      {
        area?: 'all' | 'recent' | 'trash' | 'star' | 'share'
        cid: string
      }
  >
  /** 播放页 */
  video: RouteRecordInfo<
      'video',
      '/video/:cid/:pickCode',
      {
        cid: string
        pickCode: string
      },
      {
        cid: string
        pickCode: string
      }
    >
  /** 404 */
  notFound: RouteRecordInfo<
    'not-found',
    '/:path(.*)',
    { path: string },
    { path: string },
    never
  >
}

// Last, you will need to augment the Vue Router types with this map of routes
declare module 'vue-router' {
  interface TypesConfig {
    RouteNamedMap: RouteNamedMap
  }
}
