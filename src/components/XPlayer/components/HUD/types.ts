// HUD消息数据
export interface HudMessageProgress {
  /** 最大值（用于进度条） */
  max?: number
  min?: number /** 最小值（用于进度条） */
  /** 当前进度（用于进度条显示） */
  value?: number
}

// HUD消息
export interface HudMessage {
  title?: string /** 标题 */
  value?: number | string | boolean /** 值 */
  icon?: string /** 图标 */
  iconClass?: string /** 图标类名 */
  progress?: HudMessageProgress /** 数据 */
  duration?: number /** 持续时间（毫秒）, 默认1500ms */
  /** 时间戳 */
  timestamp: number
}
