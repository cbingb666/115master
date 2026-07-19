import type { VNode } from 'vue'
import { defineComponent, isVNode } from 'vue'

const DialogTitle = defineComponent({
  name: 'DialogTitle',
  props: {
    title: { type: [String, Object, Function], default: undefined },
    className: { type: String, default: undefined },
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
      if (!props.title && !slots.default && !slots.actions && !slots.titleActions)
        return null

      const root = `sticky top-0 z-10 flex flex-col gap-2 px-6 pt-4 pb-3 sm:flex-row sm:items-center sm:justify-between ${props.className || ''}`
      const title = 'min-w-0 flex-1 text-lg font-bold'

      return (
        <div class={root}>
          <h3 class={title}>
            {slots.default ? slots.default() : render(props.title)}
          </h3>
          <div class="flex w-full items-center gap-1 sm:w-auto">
            {slots.titleActions?.()}
            {slots.actions?.()}
          </div>
        </div>
      )
    }
  },
})

export default DialogTitle
