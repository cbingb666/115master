import type { VNodeChild } from 'vue'
import { Comment, Fragment, isVNode, Text } from 'vue'

/** Returns whether slot output exposes any meaningful accessible content. */
export function filled(value: VNodeChild | VNodeChild[] | undefined): boolean {
  const nodes = Array.isArray(value) ? value : [value]

  return nodes.some((node) => {
    if (typeof node === 'string')
      return node.trim().length > 0
    if (typeof node === 'number')
      return true
    if (!isVNode(node) || node.type === Comment)
      return false
    if (node.type === Text)
      return String(node.children ?? '').trim().length > 0
    if (node.props?.['aria-hidden'] === true || node.props?.['aria-hidden'] === 'true')
      return false
    if (node.props?.['aria-label'])
      return true
    if (node.props?.alt)
      return true
    if (node.type === Fragment || Array.isArray(node.children))
      return filled(node.children as VNodeChild)
    if (typeof node.children === 'string')
      return node.children.trim().length > 0
    return typeof node.type !== 'string'
  })
}
