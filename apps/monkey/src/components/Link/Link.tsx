import type { AnchorHTMLAttributes, FunctionalComponent } from 'vue'
import type { RouterLinkProps } from 'vue-router'
import { RouterLink } from 'vue-router'

type Props = DefineProps<RouterLinkProps | AnchorHTMLAttributes>

const Link: FunctionalComponent<Props> = (props, { slots }) => {
  if ('to' in props) {
    return <RouterLink {...props}>{ slots.default?.() }</RouterLink>
  }
  return <a {...props}>{ slots.default?.() }</a>
}

export default Link
