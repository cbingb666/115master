import type {
  DialogRenderable,
  StatusFeedbackSize,
} from '@115master/ui'
import type {
  ExtractPublicPropTypes,
  PropType,
} from 'vue'
import { StatusFeedback } from '@115master/ui'
import { computed, defineComponent, mergeProps } from 'vue'
import { useAppDialog } from '@/app/dialog'
import { I, Icon } from '@/icons'
import { formatError } from '@/utils/errorFeedback'

const props = {
  error: {
    type: null as unknown as PropType<unknown>,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
  size: {
    type: String as PropType<StatusFeedbackSize>,
    default: 'md',
  },
  padded: {
    type: Boolean,
    default: true,
  },
  detailLabel: {
    type: String,
    default: '查看错误详情',
  },
  retryLabel: {
    type: String,
    default: '重试',
  },
  closeLabel: {
    type: String,
    default: '关闭',
  },
  onRetry: {
    type: Function as PropType<() => void | Promise<void>>,
    default: undefined,
  },
  onClose: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
} as const

export type ErrorStatusFeedbackProps = ExtractPublicPropTypes<typeof props>

const icons: Record<StatusFeedbackSize, string> = {
  xs: 'size-5',
  sm: 'size-7',
  md: 'size-12',
  lg: 'size-16',
}

function content(value: unknown): DialogRenderable {
  if (!(value instanceof Error))
    return formatError(value) || '未知错误'

  return () => (
    <div class="space-y-3">
      <p class="text-base-content/80 m-0 leading-6">
        {value.message || value.name}
      </p>
      {value.stack && (
        <details class="text-sm">
          <summary class="text-base-content/60 cursor-pointer font-medium select-none">
            技术详情
          </summary>
          <pre class="bg-base-200 text-base-content mt-3 max-h-64 overflow-auto rounded-lg p-3 text-xs break-all whitespace-pre-wrap select-text">
            {value.stack}
          </pre>
        </details>
      )}
    </div>
  )
}

/**
 * Monkey-owned error feedback that composes StatusFeedback with the app Dialog
 * service. Error details, close behavior and optional retry stay in one place.
 */
export const ErrorStatusFeedback = defineComponent({
  name: 'ErrorStatusFeedback',

  inheritAttrs: false,

  props,

  setup(props, { attrs }) {
    const dialog = useAppDialog()
    const message = computed(() => formatError(props.error) || '未知错误')
    const detail = computed(() => props.detailLabel.trim() || '查看错误详情')
    const retry = computed(() => props.retryLabel.trim() || '重试')
    const close = computed(() => props.closeLabel.trim() || '关闭')
    const compact = computed(() => [
      'text-error inline-flex cursor-pointer appearance-none items-center justify-center',
      'rounded-full border-0 bg-transparent',
      'focus-visible:outline-error focus-visible:outline-2 focus-visible:outline-offset-2',
      props.padded && 'p-2',
      'animate-in fade-in duration-300 [animation-timing-function:var(--ui-ease-enter)]',
    ])

    function show() {
      return dialog.confirm({
        title: props.title,
        content: content(props.error),
        confirmText: retry.value,
        cancelText: close.value,
        showConfirm: !!props.onRetry,
        showCancel: true,
        confirmOnEnter: false,
        onConfirm: props.onRetry,
        onCancel: props.onClose,
      })
    }

    return () => {
      if (!props.iconOnly) {
        return (
          <StatusFeedback
            {...attrs}
            status="error"
            message={message.value}
            size={props.size}
            padded={props.padded}
            detailLabel={detail.value}
            onDetail={() => void show()}
            data-app-error-status-feedback=""
          />
        )
      }

      return (
        <button
          {...mergeProps(attrs, {
            'class': compact.value,
            'type': 'button',
            'aria-label': `${detail.value}: ${message.value}`,
            'aria-live': 'assertive',
            'data-app-error-status-feedback': '',
            'data-app-error-status-feedback-icon-only': '',
            'onClick': () => void show(),
          })}
        >
          <span class={icons[props.size]} aria-hidden="true">
            <Icon name={I.STATUS_ERROR} size="custom" class="size-full" />
          </span>
        </button>
      )
    }
  },
})
