import type { SlotsType, VNodeChild } from 'vue'
import { defineComponent } from 'vue'
import Pill from '../../../Pill/Pill'
import './PlayerControlSurface.css'

/**
 * 播放器控制表面。统一承载一层 Float Glass，内部动作使用透明 Button。
 */
const PlayerControlSurface = defineComponent({
  name: 'PlayerControlSurface',

  props: {
    class: {
      type: String,
      default: '',
    },
  },

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    return () => (
      <Pill
        as="div"
        variant="glass-floating"
        size="md"
        class={[
          'x-player-control-surface relative h-auto min-h-10 gap-0 px-1',
          props.class,
        ].filter(Boolean).join(' ')}
      >
        {slots.default?.()}
      </Pill>
    )
  },
})

export default PlayerControlSurface
