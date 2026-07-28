import type { PropType } from 'vue'
import type { IconSize, IconValue } from './types'
import { Icon as IconifyIcon } from '@iconify/vue'
import { computed, defineAsyncComponent, defineComponent, h } from 'vue'

const sizeClasses: Record<IconSize, string> = {
  'xs': 'size-3.5',
  'sm': 'size-4',
  'md': 'size-5',
  'lg': 'size-6',
  'xl': 'size-16',
  '2xl': 'size-24',
  'custom': '',
}

const Icon = defineComponent({
  name: 'Icon',

  props: {
    name: {
      type: String as PropType<IconValue>,
      required: true,
    },
    size: {
      type: String as PropType<IconSize>,
      default: 'md',
    },
  },

  setup(props) {
    const isIon = computed(() => props.name.startsWith('ion:'))
    const custom = computed(() => {
      if (isIon.value)
        return null
      const file = props.name.replace('custom:', '')
      return defineAsyncComponent(() => import(`./custom/${file}.svg`))
    })

    return () => {
      if (isIon.value)
        return <IconifyIcon icon={props.name} class={sizeClasses[props.size]} />
      if (!custom.value)
        return null
      return h(custom.value, { class: sizeClasses[props.size] })
    }
  },
})

export default Icon
