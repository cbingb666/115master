import type {
  ExtractPublicPropTypes,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent } from 'vue'

const props = {
  class: {
    type: String,
    default: '',
  },
} as const

export type HeaderProps = ExtractPublicPropTypes<typeof props>

/**
 * An application-agnostic sticky page header with a scroll-responsive backdrop.
 * Applications own its content and can tune its offset and gutter with the
 * public `--ui-header-offset` and `--ui-header-gutter` custom properties.
 */
export const Header = defineComponent({
  name: 'Header',

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    return () => (
      <div
        class={[
          'ui-header',
          'ui-z-header sticky top-[var(--ui-header-offset,calc(var(--spacing)*2))] pb-2',
          props.class,
        ]}
        data-ui-header=""
      >
        <div
          class="ui-header__content @container flex min-w-0 items-center justify-between gap-2 overflow-hidden px-[var(--ui-header-gutter,calc(var(--spacing)*6))] py-2"
          data-ui-header-content=""
        >
          {slots.default?.()}
        </div>
      </div>
    )
  },
})
