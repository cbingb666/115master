import type { RouteLocationRaw } from 'vue-router'

/**
 * 菜单项
 */
export interface MenuItem {
  /** 图标 */
  icon: string
  /** 图标颜色 */
  iconColor?: string
  /** 名称 */
  name: string
  /** 路由 */
  to: RouteLocationRaw
}
