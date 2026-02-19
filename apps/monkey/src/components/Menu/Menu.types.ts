import type { RouteLocationRaw } from 'vue-router'

/**
 * 菜单项激活匹配条件
 */
export interface MenuItemActiveMatch {
  /** 路由名称 */
  name: string
  /** 需要匹配的路由参数 */
  params?: Record<string, string>
  /** 排除的路由参数值（任一命中即不激活） */
  notParams?: Record<string, string[]>
}

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
  /** 路由（用于导航跳转） */
  to: RouteLocationRaw
  /** 激活匹配条件（用于判断当前路由是否匹配该菜单项） */
  activeMatch?: MenuItemActiveMatch
}
