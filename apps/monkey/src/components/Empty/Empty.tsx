import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'
import { ICON_EMPTY } from '@/icons'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const paddingClasses: Record<Size, string> = {
  'xs': 'p-2',
  'sm': 'p-3',
  'md': 'p-4',
  'lg': 'p-6',
  'xl': 'p-8',
  '2xl': 'p-10',
}

const imageMarginClasses: Record<Size, string> = {
  'xs': 'mb-1',
  'sm': 'mb-2',
  'md': 'mb-3',
  'lg': 'mb-4',
  'xl': 'mb-5',
  '2xl': 'mb-6',
}

const imageSizeClasses: Record<Size, string> = {
  'xs': 'w-8 h-8',
  'sm': 'w-12 h-12',
  'md': 'w-16 h-16',
  'lg': 'w-20 h-20',
  'xl': 'w-24 h-24',
  '2xl': 'w-32 h-32',
}

const iconSizeClasses: Record<Size, string> = {
  'xs': 'text-2xl',
  'sm': 'text-3xl',
  'md': 'text-4xl',
  'lg': 'text-5xl',
  'xl': 'text-6xl',
  '2xl': 'text-8xl',
}

const textSizeClasses: Record<Size, string> = {
  'xs': 'text-xs',
  'sm': 'text-sm',
  'md': 'text-sm',
  'lg': 'text-base',
  'xl': 'text-lg',
  '2xl': 'text-xl',
}

const footerMarginClasses: Record<Size, string> = {
  'xs': 'mt-1',
  'sm': 'mt-2',
  'md': 'mt-3',
  'lg': 'mt-4',
  'xl': 'mt-5',
  '2xl': 'mt-6',
}

const Empty = defineComponent({
  name: 'Empty',

  props: {
    description: {
      type: String,
      default: '暂无数据',
    },
    image: {
      type: String,
      default: '',
    },
    size: {
      type: String as PropType<Size>,
      default: 'md',
    },
    showImage: {
      type: Boolean,
      default: true,
    },
    icon: {
      type: String,
      default: ICON_EMPTY,
    },
  },

  setup(props, { slots }) {
    return () => (
      <div
        class={`
          text-base-content/60 animate-in fade-in flex flex-col
          items-center justify-center duration-300
          ${paddingClasses[props.size]}
        `}
      >
        {props.showImage && (
          <div class={imageMarginClasses[props.size]}>
            {props.image
              ? (
                  <img
                    src={props.image}
                    class={`
                      h-auto max-w-full align-middle opacity-60
                      ${imageSizeClasses[props.size]}
                    `}
                  />
                )
              : (
                  <Icon
                    icon={props.icon}
                    class={`
                      text-base-content/30
                      ${iconSizeClasses[props.size]}
                    `}
                  />
                )}
          </div>
        )}

        <div
          class={`
            text-center leading-relaxed font-medium
            ${textSizeClasses[props.size]}
          `}
        >
          {props.description}
        </div>

        {slots.default && (
          <div class={footerMarginClasses[props.size]}>
            {slots.default()}
          </div>
        )}
      </div>
    )
  },
})

export default Empty
