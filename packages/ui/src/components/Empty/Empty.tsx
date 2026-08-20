import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { defineComponent, mergeProps } from 'vue'

export type EmptySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const props = {
  description: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  size: {
    type: String as PropType<EmptySize>,
    default: 'md',
  },
  showImage: {
    type: Boolean,
    default: true,
  },
} as const

export type EmptyProps = ExtractPublicPropTypes<typeof props>

const padding: Record<EmptySize, string> = {
  'xs': 'p-2',
  'sm': 'p-3',
  'md': 'p-4',
  'lg': 'p-6',
  'xl': 'p-8',
  '2xl': 'p-10',
}

const visualGap: Record<EmptySize, string> = {
  'xs': 'mb-1',
  'sm': 'mb-2',
  'md': 'mb-3',
  'lg': 'mb-4',
  'xl': 'mb-5',
  '2xl': 'mb-6',
}

const imageSize: Record<EmptySize, string> = {
  'xs': 'size-8',
  'sm': 'size-12',
  'md': 'size-16',
  'lg': 'size-20',
  'xl': 'size-24',
  '2xl': 'size-32',
}

const iconSize: Record<EmptySize, string> = {
  'xs': 'size-3.5',
  'sm': 'size-4',
  'md': 'size-5',
  'lg': 'size-6',
  'xl': 'size-16',
  '2xl': 'size-24',
}

const textSize: Record<EmptySize, string> = {
  'xs': 'text-xs',
  'sm': 'text-sm',
  'md': 'text-sm',
  'lg': 'text-base',
  'xl': 'text-lg',
  '2xl': 'text-xl',
}

const actionGap: Record<EmptySize, string> = {
  'xs': 'mt-1',
  'sm': 'mt-2',
  'md': 'mt-3',
  'lg': 'mt-4',
  'xl': 'mt-5',
  '2xl': 'mt-6',
}

function EmptyIcon() {
  return (
    <svg
      class="size-full"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.75"
    >
      <path d="m4.5 7.5 7.5-4 7.5 4v9l-7.5 4-7.5-4v-9Z" stroke-linejoin="round" />
      <path d="m4.5 7.5 7.5 4 7.5-4M12 11.5v9" stroke-linejoin="round" />
    </svg>
  )
}

/**
 * An application-agnostic empty-state placeholder. Callers own the message,
 * optional action content and any custom icon; visual media is decorative.
 */
export const Empty = defineComponent({
  name: 'Empty',

  inheritAttrs: false,

  props,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
    icon?: () => VNodeChild
  }>,

  setup(props, { attrs, slots }) {
    return () => (
      <div
        {...mergeProps(attrs, {
          'class': [
            'text-base-content/70 animate-in fade-in flex flex-col items-center justify-center duration-300 [animation-timing-function:var(--ui-ease-enter)]',
            padding[props.size],
          ],
          'data-ui-empty': '',
        })}
      >
        {props.showImage && (
          <div class={visualGap[props.size]} aria-hidden="true">
            {props.image
              ? (
                  <img
                    src={props.image}
                    alt=""
                    class={[
                      'h-auto max-w-full align-middle opacity-70',
                      imageSize[props.size],
                    ]}
                  />
                )
              : (
                  <span
                    class={[
                      'text-base-content/60 block [&>*]:size-full',
                      iconSize[props.size],
                    ]}
                  >
                    {slots.icon?.() ?? <EmptyIcon />}
                  </span>
                )}
          </div>
        )}

        <p class={['m-0 text-center leading-relaxed font-medium', textSize[props.size]]}>
          {props.description}
        </p>

        {slots.default && (
          <div class={actionGap[props.size]}>
            {slots.default()}
          </div>
        )}
      </div>
    )
  },
})
