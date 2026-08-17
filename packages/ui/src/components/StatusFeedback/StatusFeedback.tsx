import type {
  ExtractPublicPropTypes,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import { computed, defineComponent, mergeProps } from 'vue'
import { Button } from '../Button/Button'

export type StatusFeedbackStatus = 'error' | 'warning' | 'info' | 'success'
export type StatusFeedbackSize = 'xs' | 'sm' | 'md' | 'lg'

const props = {
  status: {
    type: String as PropType<StatusFeedbackStatus>,
    default: 'info',
  },
  message: {
    type: String,
    required: true,
  },
  size: {
    type: String as PropType<StatusFeedbackSize>,
    default: 'md',
  },
  padded: {
    type: Boolean,
    default: true,
  },
  retryLabel: {
    type: String,
    default: undefined,
  },
  onRetry: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  closeLabel: {
    type: String,
    default: undefined,
  },
  onClose: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
  detailLabel: {
    type: String,
    default: undefined,
  },
  onDetail: {
    type: Function as PropType<() => void>,
    default: undefined,
  },
} as const

export type StatusFeedbackProps = ExtractPublicPropTypes<typeof props>

const colors: Record<StatusFeedbackStatus, string> = {
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
  success: 'text-success',
}

const gaps: Record<StatusFeedbackSize, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-2',
  lg: 'gap-2',
}

const icons: Record<StatusFeedbackSize, string> = {
  xs: 'text-2xl',
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-6xl',
}

const messages: Record<StatusFeedbackSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

function StatusIcon() {
  return (
    <svg
      aria-hidden="true"
      class="size-[1em]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" stroke-linecap="round" />
      <circle cx="12" cy="16.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * An application-agnostic semantic status message with optional standard
 * actions. Callers own the message, action labels, callbacks and custom icon.
 */
export const StatusFeedback = defineComponent({
  name: 'StatusFeedback',

  inheritAttrs: false,

  props,

  slots: Object as SlotsType<{
    icon?: () => VNodeChild
  }>,

  setup(props, { attrs, slots }) {
    const container = computed(() => [
      'text-base-content/70 flex flex-col items-center justify-center',
      gaps[props.size],
      props.padded && 'p-2',
      'animate-in fade-in duration-300 [animation-timing-function:var(--ui-ease-enter)]',
    ])
    const icon = computed(() => [
      colors[props.status],
      icons[props.size],
      '[&>*]:size-[1em]',
    ])
    const message = computed(() => [
      'm-0 text-center font-medium select-text',
      messages[props.size],
    ])

    return () => {
      const retry = props.retryLabel?.trim()
      const close = props.closeLabel?.trim()
      const detail = props.detailLabel?.trim()

      if (props.onRetry && !retry)
        throw new Error('StatusFeedback requires retryLabel when onRetry is provided.')
      if (props.onClose && !close)
        throw new Error('StatusFeedback requires closeLabel when onClose is provided.')
      if (props.onDetail && !detail)
        throw new Error('StatusFeedback requires detailLabel when onDetail is provided.')

      return (
        <div
          {...mergeProps(attrs, {
            'class': container.value,
            'role': props.status === 'error' ? 'alert' : 'status',
            'aria-live': props.status === 'error' ? 'assertive' : 'polite',
            'data-ui-status-feedback': '',
          })}
        >
          <span class={icon.value} aria-hidden="true">
            {slots.icon?.() ?? <StatusIcon />}
          </span>

          <p class={message.value}>{props.message}</p>

          {props.onDetail && (
            <Button color={props.status} size="xs" onClick={() => props.onDetail?.()}>
              {detail}
            </Button>
          )}

          {props.onRetry && (
            <Button color={props.status} size="sm" onClick={() => props.onRetry?.()}>
              {retry}
            </Button>
          )}

          {props.onClose && (
            <Button color="neutral" size="xs" onClick={() => props.onClose?.()}>
              {close}
            </Button>
          )}
        </div>
      )
    }
  },
})
