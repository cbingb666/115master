import type { StatusFeedbackProps } from '@115master/ui'

type Feedback = Pick<StatusFeedbackProps, 'message'>
  & Partial<Pick<StatusFeedbackProps, 'detailLabel' | 'onDetail'>>

const media: Record<number, string> = {
  1: 'Aborted',
  2: 'Network Error',
  3: 'Decode Error',
  4: 'Source Not Supported',
}

function isMediaError(value: unknown): value is MediaError {
  return typeof MediaError !== 'undefined' && value instanceof MediaError
}

export function formatError(value: unknown): string {
  if (value instanceof Error)
    return `${value.name}: ${value.message}`
  if (isMediaError(value))
    return media[value.code] ?? (value.message || 'Media Error')
  if (value == null)
    return ''
  return String(value)
}

function copy(value: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard)
    return

  try {
    return navigator.clipboard.writeText(value)
  }
  catch {
    return undefined
  }
}

function show(error: Error) {
  const detail = [
    `[Error name]: ${error.name}`,
    `[Error message]: ${error.message}`,
    error.stack ? `[Error stack]: ${error.stack}` : undefined,
  ].filter(Boolean).join('\n')

  const copied = copy(detail)
  alert(detail)
  void copied
    ?.then(() => alert('已将错误信息复制到剪贴板'))
    .catch(() => {})
}

/** Adapts application errors to the UI Foundation status-feedback interface. */
export function errorFeedback(value: unknown): Feedback {
  const message = formatError(value)

  if (!(value instanceof Error))
    return { message }

  return {
    message,
    detailLabel: '查看错误',
    onDetail: () => show(value),
  }
}
