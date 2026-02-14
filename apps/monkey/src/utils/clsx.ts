/**
 * clsx
 * @description 它是只是为 tailwindCSS 插件提供类型提示，它不对传入值做任何处理
 */
export function clsx<T>(classnames: T): T {
  return classnames
}
