import type { MaybeRefOrGetter } from 'vue'

export interface Action {
  /** 名称 */
  name: string
  /** 标签 */
  label: string
  /** 图标 */
  icon: string
  /** 图标颜色 */
  iconColor?: string
  /** 激活标签 */
  activeLabel?: string
  /** 激活图标 */
  activeIcon?: string
  /** 激活图标颜色 */
  activeIconColor?: string
  /** 是否激活 */
  active?: MaybeRefOrGetter<boolean>
  /** 是否显示 */
  show?: MaybeRefOrGetter<boolean>
  /** 点击事件 */
  onClick?: (item: Action) => Promise<void> | void
}
