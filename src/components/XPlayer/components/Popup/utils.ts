/**
 * 触发元素集合
 */
export const triggerSet = new Set<HTMLElement>()

/**
 * 判断是否在触发元素集合内
 * @param event 事件
 * @returns 是否在触发元素集合内
 */
export function isInTriggerSet(event: MouseEvent): boolean {
  return Array.from(triggerSet).some(trigger =>
    isInContainsTrigger(event, trigger),
  )
}

/**
 * 判断是否在元素内
 * @param event 事件
 * @param elm 元素
 * @returns 是否在元素内
 */
export function isInContainsTrigger(event: MouseEvent, elm?: HTMLElement): boolean {
  if (!elm)
    return false
  return elm.contains(event.target as Node)
}

/**
 * 判断是否在其他触发元素内
 * @param event 事件
 * @param elm 元素
 * @returns 是否在其他触发元素内
 */
export function isInOtherTrigger(event: MouseEvent, elm?: HTMLElement): boolean {
  return isInTriggerSet(event) && !isInContainsTrigger(event, elm)
}
