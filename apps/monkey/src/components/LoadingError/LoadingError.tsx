import type { PropType, VNode } from 'vue'
import { Icon } from '@iconify/vue'
import { useClipboard } from '@vueuse/core'
import { computed, defineComponent } from 'vue'
import { MEDIA_ERROR_NAME } from '@/components/XPlayer/index.const'
import { ICON_ERROR } from '@/icons'

type ErrorType = 'error' | 'warning' | 'info' | 'success'
type Size = 'mini' | 'small' | 'medium' | 'large'

const containerGapClasses: Record<Size, string> = {
  mini: 'gap-1',
  small: 'gap-2',
  medium: 'gap-2',
  large: 'gap-2',
}

const iconSizeClasses: Record<Size, string> = {
  mini: 'text-2xl',
  small: 'text-3xl',
  medium: 'text-5xl',
  large: 'text-6xl',
}

const textSizeClasses: Record<Size, string> = {
  mini: 'text-xs',
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
}

export const LoadingError = defineComponent({
  name: 'LoadingError',

  props: {
    type: {
      type: String as PropType<ErrorType>,
      default: 'error',
    },
    retryable: {
      type: Boolean,
      default: false,
    },
    closable: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String as PropType<unknown>,
    },
    retryText: {
      type: String,
      default: '重试',
    },
    closeText: {
      type: String,
      default: '关闭',
    },
    noPadding: {
      type: Boolean,
      default: false,
    },
    size: {
      type: String as PropType<Size>,
      default: 'medium',
    },
    icon: {
      type: String,
      default: ICON_ERROR,
    },
    showDetailButton: {
      type: Boolean,
      default: true,
    },
  },

  emits: ['retry', 'close'] as const,

  setup(props, { emit, slots }: { emit: (event: 'retry' | 'close') => void, slots: { default?: () => VNode } }) {
    const iconName = computed(() => props.icon)

    function isError(value: unknown): value is Error {
      return value instanceof Error
    }

    function formatErrorMessage(message: string | Error | MediaError | unknown): string {
      if (isError(message)) {
        return `${message.name}: ${message.message}`
      }
      if (message instanceof MediaError) {
        if (message.code in MEDIA_ERROR_NAME) {
          return `${MEDIA_ERROR_NAME[message.code as keyof typeof MEDIA_ERROR_NAME]}`
        }
      }
      return message as string
    }

    function handleDetail(detail: string | Error | unknown): string {
      if (isError(detail)) {
        return `[Error name]: ${detail.name}\n[Error message]: ${detail.message}\n[Error stack]: ${detail.stack}`
      }
      return detail as string
    }

    function handleShowDetail() {
      const detail = handleDetail(props.message)
      const { copy } = useClipboard()
      copy(detail)
      alert(detail)
      alert('已将错误信息复制到剪贴板')
    }

    const containerClass = computed(() => `
      text-base-content/70 flex flex-col items-center justify-center
      ${containerGapClasses[props.size]}
      ${!props.noPadding && props.size !== 'mini' ? 'p-2' : ''}
      animate-in fade-in duration-300
    `.replace(/\s+/g, ' ').trim())

    const iconClass = computed(() => `
      text-${props.type}
      ${iconSizeClasses[props.size]}
    `.replace(/\s+/g, ' ').trim())

    const textClass = computed(() => `
      m-0 text-center font-medium select-text
      ${textSizeClasses[props.size]}
    `.replace(/\s+/g, ' ').trim())

    return () => (
      <div class={containerClass.value}>
        <Icon icon={iconName.value} class={iconClass.value} />

        <p class={textClass.value}>
          {slots.default ? slots.default() : formatErrorMessage(props.message)}
        </p>

        {props.showDetailButton && isError(props.message) && (
          <button
            class="btn btn-error btn-xs"
            onClick={handleShowDetail}
          >
            查看错误
          </button>
        )}

        {props.retryable && (
          <button
            class="btn btn-error btn-sm hover:btn-error transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => emit('retry')}
          >
            {props.retryText}
          </button>
        )}

        {props.closable && (
          <button
            class="btn btn-neutral btn-xs"
            onClick={() => emit('close')}
          >
            {props.closeText}
          </button>
        )}
      </div>
    )
  },
})

export default LoadingError
