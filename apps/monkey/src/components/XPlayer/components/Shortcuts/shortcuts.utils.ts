import type {
  Action,
  ActionGroup,
  ActionKey,
  ActionKeyBindings,
  ActionMatch,
  DefaultActionKey,
  DisplayKeyNameMap,
  KeyBinding,
  KeyBindingArr,
  KeyBindingConflict,
  KeyBindingConflictsMap,
  KeyBindings,
  KeyBindingStr,
  Platform,
} from './shortcuts.types'
import { capitalize } from 'lodash'
import {
  BASE_DISPLAY_KEY_NAME_MAP,
  KEY_BINDING_SEPARATOR,
  MODIFIERS,
  MULTI_LAYER_KEYS,
  PLATFORM_DISPLAY_KEY_NAME_MAP,
} from './shortcuts.const'

// ======================= Group =======================

/**
 * 为配置对象的所有 action 添加相同的 group
 */
export function withGroup<T extends Record<string, Action>>(
  actionMap: T,
  group: ActionGroup,
): Record<keyof T, Action & { group: ActionGroup }> {
  return Object.fromEntries(
    Object.entries(actionMap)
      .map(([key, action]) => [
        key as keyof T,
        {
          ...action,
          group,
        },
      ]),
  ) as Record<keyof T, Action & { group: ActionGroup }>
}

// ======================= Key =======================

/**
 * 绑定键字符串解析
 * @description 将绑定键字符串解析为绑定键数组,如果已经是数组则直接返回
 * @param keyBinding 绑定键
 * @returns 绑定键数组
 */
export function keyBindingParse(
  keyBinding: KeyBinding,
): KeyBindingArr {
  if (Array.isArray(keyBinding)) {
    return keyBinding
  }
  return keyBinding.split(KEY_BINDING_SEPARATOR).filter(item => item !== '')
}

/**
 * 绑定键数组字符串化
 * @description 将绑定键数组字符串化为绑定键字符串,如果已经是字符串则直接返回
 * @param keyBinding 绑定键
 * @returns 绑定键字符串
 */
export function keyBindingStringify(
  keyBinding: KeyBinding,
): KeyBindingStr {
  if (typeof keyBinding === 'string') {
    return keyBinding
  }

  return keyBinding.join(KEY_BINDING_SEPARATOR)
}

/**
 * 获取规范化的按键名
 * @description 将按键名转换为小写
 * @param key 按键
 * @returns 规范化的按键
 */
function getNormalizedKey(key: string): string {
  return key.toLowerCase()
}

/**
 * 获取规范化的绑定键
 * @param key 绑定键
 * @returns 规范化的绑定键
 */
function getNormalizedKeyBinding(key: KeyBinding): string {
  return keyBindingParse(key)
    .map(k => getNormalizedKey(k))
    .join(KEY_BINDING_SEPARATOR)
}

/**
 * 从 event.code 解析实际按键字符
 * 例如：KeyZ -> Z, Digit1 -> 1, Space -> ' '
 * @param code 按键代码
 * @returns 实际按键字符
 */
export function parseKeyFromCode(
  code: KeyboardEvent['code'],
): string | null {
  const CODE_KEY = 'Key'
  const CODE_DIGIT = 'Digit'

  /** 字母键：KeyA -> a */
  if (code.startsWith(CODE_KEY)) {
    return code.replace(CODE_KEY, '').toLowerCase()
  }

  /** 数字键：Digit1 -> 1 */
  if (code.startsWith(CODE_DIGIT)) {
    return code.replace(CODE_DIGIT, '')
  }

  return MULTI_LAYER_KEYS[code] || null
}

/**
 * 从按键事件中获取修饰键
 * @param event 按键事件
 * @returns 修饰键数组
 */
function getModifiersFromEvent(
  event: KeyboardEvent,
): string[] {
  return Object.entries({
    Control: event.ctrlKey,
    Meta: event.metaKey,
    Alt: event.altKey,
    Shift: event.shiftKey,
  }).reduce<string[]>((acc, [key, isActive]) => {
    if (isActive)
      acc.push(MODIFIERS[key as keyof typeof MODIFIERS])
    return acc
  }, [])
}

/**
 * 从按键事件中获取非修饰键
 * @param event 按键事件
 * @returns 非修饰键
 */
function getNonModifierKeyFromEvent(
  event: KeyboardEvent,
): string {
  return parseKeyFromCode(event.code) || event.key
}

/**
 * 从按键事件中获取绑定键数组
 * @param event 按键事件
 * @returns 绑定键数组
 */
function getKeyBindingArrFromEvent(
  event: KeyboardEvent,
): KeyBindingArr {
  const modifiers = getModifiersFromEvent(event)
  const nonModifierKey = getNonModifierKeyFromEvent(event)

  // 如果按下的只是修饰键本身，直接返回修饰键数组
  if (Object.values(MODIFIERS).includes(nonModifierKey)) {
    return modifiers
  }

  return [...modifiers, nonModifierKey]
}

/**
 * 将键盘事件转换为绑定键
 * @param event 按键事件
 * @returns 绑定键字符串
 */
export function getKeyBindingStringFromEvent(
  event: KeyboardEvent,
): KeyBindingStr {
  const keyBindingArr = getKeyBindingArrFromEvent(event)
  return keyBindingStringify(keyBindingArr)
}

/**
 * 判断两个快捷键字符串是否相同
 * @param a 绑定键 a
 * @param b 绑定键 b
 * @returns 是否相同
 */
export function isSameKeyBinding(
  a: KeyBinding,
  b: KeyBinding,
): boolean {
  const arrA = keyBindingParse(a)
  const arrB = keyBindingParse(b)

  if (arrA.length !== arrB.length) {
    return false
  }

  /** 使用 Set 来处理无序比较 */
  const setB = new Set(arrB.map(k => getNormalizedKey(k)))
  return arrA.every(key => setB.has(getNormalizedKey(key)))
}

// ======================= key =======================

/**
 * 判断两个绑定键组是否相同
 * @param a 绑定键组 a
 * @param b 绑定键组 b
 * @returns 是否相同
 */
export function isSameKeyBindings(
  a: KeyBindings,
  b: KeyBindings,
): boolean {
  if (a.length !== b.length) {
    return false
  }
  return a.every((keyA, index) => {
    const keyB = b[index]
    return isSameKeyBinding(keyA, keyB)
  })
}

/**
 * 判断绑定键数量是否超过最大值
 * @param keyBindings 映射
 * @param action 动作
 * @returns 是否超过最大快捷键数量
 */
export function isMaxKeybindings(
  keyBindings: KeyBindings,
  action: Action,
): boolean {
  const maxShortcuts = action.maxShortcuts || Infinity
  return keyBindings.length >= maxShortcuts
}

/**
 * 检查绑定键是否包含空快捷键
 * @param keyBindings 绑定键
 * @returns 是否包含空的绑定键
 */
export function hasEmptyKeybindings(keyBindings: KeyBindings): boolean {
  return keyBindings.includes('')
}

/**
 * 获取绑定键组
 * @param actionKey 动作键
 * @param actionKeyBindings 动作映射配置
 * @returns 绑定键组
 */
function getKeyBindings(
  actionKey: ActionKey,
  actionKeyBindings: ActionKeyBindings,
): KeyBindings {
  return actionKeyBindings[actionKey] || []
}

/**
 * 获取按键显示名称映射
 * @returns 按键显示名称映射
 */
export function getDisplayKeyNameMap(): DisplayKeyNameMap {
  return {
    ...BASE_DISPLAY_KEY_NAME_MAP,
    ...PLATFORM_DISPLAY_KEY_NAME_MAP[getPlatform()],
  }
}

/**
 * 格式化按键显示名称
 * @param keyBinding 绑定键
 * @returns 格式化后的按键显示名称
 */
export function formatKeyDisplay(keyBinding: KeyBindingStr): string {
  const displayKeyNameMap = getDisplayKeyNameMap()
  const keyBindingArr = keyBindingParse(keyBinding)
  return keyBindingStringify(
    keyBindingArr.map((key) => {
      return capitalize(displayKeyNameMap[key] || key)
    }),
  ).replace(KEY_BINDING_SEPARATOR, ` ${KEY_BINDING_SEPARATOR} `)
}

/**
 * 检查快捷键是否只包含修饰键
 * @param keyBinding 快捷键字符串
 * @returns 是否只包含修饰键
 */
export function isOnlyModifier(
  keyBinding: KeyBindingStr | KeyBindingArr,
): boolean {
  const keys = keyBindingParse(keyBinding)
  return keys.every(key => Object.values(MODIFIERS).includes(key))
}

// ======================= Conflict =======================

/**
 * 创建冲突条目
 * @param actionKey 动作键
 * @param keyBinding 绑定键
 * @param index 索引
 * @returns 冲突条目
 */
function createConflictEntry(
  actionKey: string,
  keyBinding: KeyBinding,
  index: number,
): KeyBindingConflict {
  return {
    actionKey,
    keyBinding: typeof keyBinding === 'string'
      ? keyBinding
      : keyBindingStringify(keyBinding),
    index,
  }
}

/**
 * 添加单个冲突记录
 * @param keyBindingConflictsMap 冲突映射表
 * @param target 目标冲突条目
 * @param source 源冲突条目
 */
function addConflict(
  keyBindingConflictsMap: KeyBindingConflictsMap,
  target: KeyBindingConflict,
  source: KeyBindingConflict,
) {
  if (!keyBindingConflictsMap.has(target.keyBinding)) {
    keyBindingConflictsMap.set(target.keyBinding, [])
  }
  keyBindingConflictsMap.get(target.keyBinding)!.push({
    actionKey: source.actionKey,
    keyBinding: source.keyBinding,
    index: source.index,
  })
}

/**
 * 计算所有冲突
 * @param actionKeyBindings 动作映射表
 * @returns 冲突映射表
 */
export function calculateAllConflicts(
  actionKeyBindings: ActionKeyBindings,
): KeyBindingConflictsMap {
  const keyBindingConflictMap: KeyBindingConflictsMap = new Map()
  const visitedKeyMap = new Map<KeyBindingStr, KeyBindingConflict[]>()

  for (const [actionKey, keyBindings] of Object.entries(actionKeyBindings)) {
    if (!keyBindings)
      continue

    keyBindings.forEach((originKeyBinding, index) => {
      if (!originKeyBinding)
        return

      const normlizedKeyBinding = getNormalizedKeyBinding(originKeyBinding)
      const currentEntry = createConflictEntry(
        actionKey,
        originKeyBinding,
        index,
      )
      const existingEntries = visitedKeyMap.get(normlizedKeyBinding)

      if (existingEntries) {
        for (const prevEntry of existingEntries) {
          addConflict(keyBindingConflictMap, prevEntry, currentEntry)
          addConflict(keyBindingConflictMap, currentEntry, prevEntry)
        }
        existingEntries.push(currentEntry)
      }
      else {
        visitedKeyMap.set(normlizedKeyBinding, [currentEntry])
      }
    })
  }
  return keyBindingConflictMap
}

/**
 * 获取动作的快捷键提示文本
 * @param actionKeys 操作键
 * @param actionKeyBindings 当前合并的映射配置
 * @returns 快捷键提示文本，如果没有配置则返回空字符串
 */
export function getShortcutsTip(
  actionKeys: (DefaultActionKey | ActionKey)[],
  actionKeyBindings: ActionKeyBindings,
): string {
  if (!actionKeyBindings)
    return ''
  const keyBindings = actionKeys
    .map(actionKey => actionKeyBindings[actionKey])
    .filter(keyBindings => keyBindings && keyBindings.length)
    .map(keyBindings => keyBindings[0])

  if (!keyBindings.length)
    return ''

  return `${keyBindings.map(formatKeyDisplay).join('/')}`
}

// ======================= Action =======================

/**
 * 匹配动作
 * @param event 按键事件
 * @param actionKeyBindings 映射配置
 * @param actionMap 动作配置
 * @returns 匹配的动作
 */
export function matchAction(
  event: KeyboardEvent,
  actionKeyBindings: ActionKeyBindings,
  actionMap: Record<string, Action>,
): ActionMatch | null {
  const eventKeyBinding = getKeyBindingArrFromEvent(event)

  for (const actionKey of Object.keys(actionMap) as ActionKey[]) {
    const keyBindings = getKeyBindings(actionKey, actionKeyBindings)
    const action = actionMap[actionKey]

    for (let index = 0; index < keyBindings.length; index++) {
      const keyBinding = keyBindings[index]

      if (isSameKeyBinding(eventKeyBinding, keyBinding)) {
        return { actionKey, keyBinding, action, index }
      }
    }
  }
  return null
}

// ======================= Misc =======================

/**
 * 检查目标元素是否是可编辑元素
 * @param target 事件目标
 * @returns 是否是可编辑元素
 */
export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement))
    return false

  const tagName = target.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select')
    return true

  return target.isContentEditable
}

/**
 * 获取操作系统平台
 * @returns 操作系统平台
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData
 */
export function getPlatform(): Platform {
  const userAgent = navigator.userAgent.toLowerCase()
  if (userAgent.includes('mac'))
    return 'mac'
  if (userAgent.includes('win'))
    return 'windows'
  return 'linux'
}
