import type { SlotsType, VNodeChild } from 'vue'
import { defineComponent, mergeProps, provide, shallowRef } from 'vue'
import { overlayHostKey } from './context'

/**
 * A Theme-scoped target for transient UI. Descendants resolve the nearest host
 * so their Teleports remain inside the owning application Theme.
 */
export const OverlayHost = defineComponent({
  name: 'OverlayHost',

  inheritAttrs: false,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(_, { attrs, slots }) {
    const host = shallowRef<HTMLDivElement>()
    provide(overlayHostKey, host)

    return () => (
      <div
        {...mergeProps(attrs, {
          'ref': host,
          'class': 'ui-overlay-host',
          'data-ui-overlay-host': '',
        })}
      >
        {slots.default?.()}
      </div>
    )
  },
})
