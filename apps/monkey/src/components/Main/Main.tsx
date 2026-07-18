import type { SlotsType } from 'vue'
import { defineComponent, ref } from 'vue'

const Main = defineComponent({
  name: 'Main',
  slots: Object as SlotsType<{
    default: () => void
  }>,
  setup: (_, { slots, expose }) => {
    const el = ref<HTMLElement>()
    expose({ el })

    return () => (
      <div
        ref={el}
        class="ml-(--sider-width) flex-1"
      >
        {slots.default?.()}
      </div>
    )
  },
})

export default Main
