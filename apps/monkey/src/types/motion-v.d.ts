import type { DefineComponent, StyleValue } from 'vue'

/**
 * motion-v 2.3 的根声明会经 framer-motion/dom 引入 React JSX 全局类型。
 * 运行时仍使用官方包；这里只隔离 Monkey 当前使用的 Vue 组件表面。
 */
export interface MotionSpringTransition {
  type: 'spring'
  visualDuration: number
  bounce: number
}

interface MotionDivProps {
  'class'?: unknown
  'style'?: StyleValue
  'layoutId'?: string
  'transition'?: MotionSpringTransition
  'onLayoutAnimationStart'?: () => void
  'onLayoutAnimationComplete'?: () => void
  'data-captcha-motion-source'?: number
  'data-captcha-motion-target'?: number
  'data-captcha-layout-id'?: string
}

export const motion: {
  div: DefineComponent<MotionDivProps>
}

export const LayoutGroup: DefineComponent<{
  id?: string
}>

export const MotionConfig: DefineComponent<{
  reducedMotion?: 'user' | 'never' | 'always'
}>
