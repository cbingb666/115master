/**
 * stories type-check 的 react 类型占位。
 *
 * stories 引用的 @storybook/* 类型链会 import 'react'，把 @types/react 拉进 compilation，
 * 其全局 JSX namespace 会劫持同 program 内 app TSX 组件的 JSX 检查（Vue 的 class 被误判
 * 为 React 规则而报 className）。stories 不做 React 渲染，这里提供最小占位让 storybook
 * 类型中的 react 引用解析为 any；经 tsconfig.stories.json 的 paths 映射生效。
 */

export type ReactNode = any
export type ReactElement = any
export type ReactPortal = any
export type ReactChild = any
export type ReactFragment = any
export type Ref<T> = any
export type RefObject<T> = any
export type MutableRefObject<T> = any
export type ComponentType<P = unknown> = any
export type FunctionComponent<P = unknown> = any
export type FC<P = unknown> = any
export type ComponentClass<P = unknown, S = any> = any
export type Component<P = unknown, S = any> = any
export type PureComponent<P = unknown, S = any> = any
export type ComponentProps<T> = any
export type PropsWithChildren<P = unknown> = any
export type CSSProperties = any
export type SyntheticEvent<T = Element> = any
export type MouseEvent<T = Element> = any
export type KeyboardEvent<T = Element> = any
export type FocusEvent<T = Element> = any
export type ChangeEvent<T = Element> = any
export type DragEvent<T = Element> = any
export type PointerEvent<T = Element> = any
export type WheelEvent<T = Element> = any
export type TouchEvent<T = Element> = any
export type FormEvent<T = Element> = any
export type UIEvent<T = Element> = any
export type AnimationEvent<T = Element> = any
export type TransitionEvent<T = Element> = any

export namespace JSX {
  type Element = any
  type ElementClass = any
  interface IntrinsicElements {
    [elemName: string]: any
  }
}

declare const react: any
export default react
