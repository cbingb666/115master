import type { FunctionalComponent } from 'vue'
import type { Props } from '@/components/Link/Link.types'
import { RouterLink } from 'vue-router'

/**
 * 链接组件
 */
export const Link: FunctionalComponent<Props> = (props, { slots }) => {
  if ('to' in props) {
    return <RouterLink {...props}>{ slots.default?.() }</RouterLink>
  }
  return <a {...props}>{ slots.default?.() }</a>
}
