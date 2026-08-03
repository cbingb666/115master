import type { RequireAtLeastOne } from 'type-fest'
import type { DEFAULT_ACTION_MAP } from './shortcuts.actions'
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'

// ======================= 绑定键 =======================

/**
 * 绑定键
 * @description 绑定键的字符串
 * @example 'Shift+A' | 'A'
 */
export type KeyBindingStr = string

/**
 * 绑定键数组
 * @description 绑定键的数组
 * @example ['Shift', 'A'] | ['A']
 */
export type KeyBindingArr = string[]

/**
 * 绑定键
 * @description 绑定键的联合类型。
 */
export type KeyBinding = KeyBindingStr | KeyBindingArr

/**
 * 绑定键组
 */
export type KeyBindings = KeyBindingStr[]

/**
 * 按键显示名称映射
 */
export type DisplayKeyNameMap = Record<string, string>

// ======================= 动作 =======================

export type DefaultActionKey = keyof typeof DEFAULT_ACTION_MAP

/** 动作键 */
export type ActionKey = string

/**
 * 动作分组
 */
export interface ActionGroup {
  /**
   * 键
   */
  key: string
  /**
   * 名称
   */
  name: string
  /**
   * icon
   */
  icon?: string
}

/** 动作 */
export type Action = RequireAtLeastOne<{
  /**
   * 名称
   */
  name: string
  /**
   * 分组
   * @description 用于界面分组展示
   */
  group?: ActionGroup
  /**
   * 是否重复
   * @description 长按按键是否会触发重复动作
   * @default false
   */
  allowRepeat?: boolean
  /** 允许动作在显式接入 XPlayer 快捷键的原生模态表面内执行。 */
  allowInModal?: boolean
  /**
   * 最大快捷键数量
   * @description 用于限制单个动作可以绑定的快捷键数量
   * @default undefined 无限制
   */
  maxShortcuts?: number
  /**
   * 操作提示说明
   * @description 在设置界面以 tooltip 形式显示的额外说明文本
   */
  tip?: string
  /**
   * 按键按下
   * @description 按键按下时触发的事件，这里可以处理动作的逻辑
   */
  keydown?: (
    ctx: PlayerContext,
    event: KeyboardEvent,
    action: ActionMatch,
  ) => void
  /**
   * 按键抬起
   * @description 按键抬起时触发的事件，这里可以处理动作的逻辑
   */
  keyup?: (
    ctx: PlayerContext,
    event: KeyboardEvent,
    action: ActionMatch,
  ) => void
}, 'keydown' | 'keyup'>

/**
 * 动作 Maps
 */
export type ActionMap = Record<ActionKey, Action>

/**
 * 默认动作 Maps
 */
export type DefaultActionMap = Record<DefaultActionKey, Action>

/**
 * 动作映射表
 * @description 动作映射表是一个对象，键是动作键，值是动作映射
 */
export type ActionKeyBindings = Record<ActionKey, KeyBindings>

/**
 * 匹配动作
 */
export interface ActionMatch {
  /** 动作键。 */
  actionKey: ActionKey
  /**
   * 绑定键
   */
  keyBinding: KeyBindingStr
  /**
   * 动作
   */
  action: Action
  /**
   * 快捷键在映射数组中的索引
   */
  index: number
}

// ======================= Misc =======================

/**
 * 外部快捷键配置
 */
export interface ShortcutsExt {
  /**
   * 动作配置表
   */
  actionMap: ActionMap
  /**
   * 动作映射表
   */
  actionKeyBindings?: ActionKeyBindings
}

/**
 * 快捷键偏好
 */
export interface ShortcutsPreference {
  /** 动作映射表 */
  actionKeyBindings: ActionKeyBindings
}

/**
 * 操作系统平台
 */
export type Platform = 'mac' | 'windows' | 'linux'

/**
 * 绑定键冲突信息
 */
export interface KeyBindingConflict {
  /** 动作键 */
  actionKey: ActionKey
  /** 绑定键 */
  keyBinding: KeyBindingStr
  /** 索引 */
  index: number
}

/**
 * 绑定键冲突映射表
 */
export type KeyBindingConflictsMap = Map<KeyBinding, KeyBindingConflict[]>
