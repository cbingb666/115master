import type { VNode } from 'vue'
import { defineComponent, isVNode } from 'vue'

const DialogTitle = defineComponent({
  name: 'DialogTitle',
  props: {
    title: { type: [String, Object, Function], default: undefined },
    className: { type: String, default: undefined },
    frosted: { type: Boolean, default: true },
  },
  setup(props, { slots }) {
    function render(value: unknown) {
      if (value === undefined || value === null)
        return ''
      if (typeof value === 'function')
        return (value as () => VNode)()
      if (isVNode(value))
        return value
      return value as string
    }

    return () => {
      if (!props.title && !slots.default && !slots.actions)
        return null

      const root = `sticky top-0 z-10 flex items-center justify-between gap-2 p-6 pb-4 bg-base-200/5 ${props.frosted ? 'backdrop-blur-2xl' : ''} ${props.className || ''}`
      const title = 'min-w-0 flex-1 text-lg font-bold'

      return (
        <div class={root}>
          <h3 class={title}>
            {slots.default ? slots.default() : render(props.title)}
          </h3>
          {slots.actions?.()}
        </div>
      )
    }
  },
})

export default DialogTitle
