import type {
  ExtractPublicPropTypes,
  InjectionKey,
  PropType,
  SlotsType,
  VNodeChild,
} from 'vue'
import type { ModalInitialFocus } from '../Modal/ModalRoot'
import type {
  DialogCloseReason,
  DialogSize,
} from './Dialog'
import {
  defineComponent,
  inject,
  nextTick,
  onBeforeUnmount,
  provide,
  shallowReactive,
  useId,
} from 'vue'
import { Button } from '../Button/Button'
import { filled } from '../content'
import { useModalHost } from '../Modal/ModalHost'
import { Dialog } from './Dialog'

export type DialogRenderable = VNodeChild | (() => VNodeChild)
export type DialogConfirmHandler = () => void | false | Promise<void | false>
export type DialogPromptConfirmHandler
  = (value: string) => void | false | Promise<void | false>

export interface DialogServiceMessages {
  confirm: DialogRenderable
  cancel: DialogRenderable
  inputLabel: DialogRenderable
  requiredError: DialogRenderable
}

export interface DialogServiceOptions {
  messages: DialogServiceMessages
  onError: (error: unknown) => void
}

export interface DialogOptions {
  title?: DialogRenderable
  label?: string
  content?: DialogRenderable
  confirmText?: DialogRenderable
  cancelText?: DialogRenderable
  messages?: Partial<DialogServiceMessages>
  showConfirm?: boolean
  showCancel?: boolean
  confirmOnEnter?: boolean
  size?: DialogSize
  closeOnEscape?: boolean
  closeOnBackdrop?: boolean
  initialFocus?: ModalInitialFocus
  onCancel?: () => void
  onOpened?: () => void
  onError?: (error: unknown) => void
}

export interface DialogAlertOptions extends DialogOptions {
  onConfirm?: DialogConfirmHandler
}

export interface DialogConfirmOptions extends DialogOptions {
  onConfirm?: DialogConfirmHandler
}

export interface DialogPromptOptions extends DialogOptions {
  defaultValue?: string
  placeholder?: string
  inputType?: 'text' | 'password' | 'email' | 'number' | 'textarea'
  multiline?: boolean
  rows?: number
  required?: boolean
  maxLength?: number
  inputLabel?: DialogRenderable
  requiredError?: DialogRenderable
  onConfirm?: DialogPromptConfirmHandler
}

export interface DialogCreateOptions extends DialogOptions {
  onConfirm?: DialogConfirmHandler
}

const runtimeKey: unique symbol = Symbol('uiDialogRuntime')

export interface DialogOutcome {
  reason: DialogCloseReason
}

export interface DialogHandle {
  close: () => void
  destroy: () => void
  closed: Promise<DialogOutcome>
}

export interface DialogService {
  readonly [runtimeKey]: unknown
  alert: (options: DialogAlertOptions) => Promise<void>
  confirm: (options: DialogConfirmOptions) => Promise<boolean>
  prompt: (options: DialogPromptOptions) => Promise<string | null>
  create: (options: DialogCreateOptions) => DialogHandle
  closeAll: () => void
}

type DialogKind = 'alert' | 'confirm' | 'prompt' | 'custom'
type DialogEntryOptions
  = | DialogAlertOptions
    | DialogConfirmOptions
    | DialogPromptOptions
    | DialogCreateOptions

interface DialogEntry {
  id: number
  kind: DialogKind
  options: DialogEntryOptions
  open: boolean
  pending: boolean
  invalid: boolean
  opened: boolean
  closing: boolean
  done: boolean
  reported: boolean
  value: string
  confirmedValue?: string
  outcome?: DialogOutcome
  resolve: (outcome: DialogOutcome) => void
  reject: (error: unknown) => void
  closed: Promise<DialogOutcome>
}

interface DialogRuntime {
  messages: DialogServiceMessages
  onError: (error: unknown) => void
  entries: DialogEntry[]
  hosts: number
  next: number
  open: (kind: DialogKind, options: DialogEntryOptions) => DialogEntry
  finish: (entry: DialogEntry, reason: DialogCloseReason, immediate?: boolean) => void
  fail: (entry: DialogEntry, error: unknown) => void
  failAll: (error: unknown) => void
}

const key: InjectionKey<DialogService> = Symbol('uiDialogService')

function present(value: DialogRenderable | undefined) {
  if (value === undefined || value === null || value === false)
    return false
  return typeof value !== 'string' || value.trim().length > 0
}

function error(message: string) {
  return new Error(message)
}

function rejected(error: unknown): DialogHandle {
  const closed = Promise.reject<DialogOutcome>(error)

  void closed.catch(() => undefined)

  return {
    closed,
    close: () => undefined,
    destroy: () => undefined,
  }
}

function internal(service: DialogService) {
  const runtime = service[runtimeKey]

  return runtime && typeof runtime === 'object'
    ? runtime as DialogRuntime
    : undefined
}

function report(runtime: DialogRuntime, entry: DialogEntry, cause: unknown) {
  const handler = entry.options.onError ?? runtime.onError

  try {
    handler(cause)
  }
  catch {
    // The original caller-owned failure remains the service outcome.
  }
}

function fault(runtime: DialogRuntime, entry: DialogEntry, cause: unknown) {
  if (entry.reported || entry.done)
    return

  entry.reported = true
  entry.open = false
  report(runtime, entry, cause)
  queueMicrotask(() => runtime.fail(entry, cause))
}

function validate(runtime: DialogRuntime, kind: DialogKind, options: DialogEntryOptions) {
  if (!present(options.title) && !options.label?.trim())
    throw error('Dialog options require a title or accessible label.')

  if (kind !== 'prompt')
    return

  const prompt = options as DialogPromptOptions
  const messages = { ...runtime.messages, ...prompt.messages }

  if (!present(prompt.inputLabel ?? messages.inputLabel))
    throw error('Prompt options require an accessible input label.')
  if (prompt.required && !present(prompt.requiredError ?? messages.requiredError))
    throw error('Required Prompt options require an accessible error message.')
}

function createRuntime(options: DialogServiceOptions): DialogRuntime {
  const entries = shallowReactive<DialogEntry[]>([])
  const runtime: DialogRuntime = {
    messages: options.messages,
    onError: options.onError,
    entries,
    hosts: 0,
    next: 0,
    open: () => {
      throw error('Dialog service is not ready.')
    },
    finish: () => undefined,
    fail: () => undefined,
    failAll: () => undefined,
  }

  function remove(entry: DialogEntry) {
    const index = entries.indexOf(entry)

    if (index !== -1)
      entries.splice(index, 1)
  }

  function fail(entry: DialogEntry, cause: unknown) {
    if (entry.done)
      return
    entry.done = true
    entry.open = false
    remove(entry)
    entry.reject(cause)
  }

  function finish(entry: DialogEntry, reason: DialogCloseReason, immediate = false) {
    if (entry.done || entry.closing)
      return

    entry.closing = true
    entry.outcome = { reason }
    entry.open = false

    if (!immediate && entry.opened)
      return

    entry.done = true
    remove(entry)
    entry.resolve(entry.outcome)
  }

  function open(kind: DialogKind, entryOptions: DialogEntryOptions) {
    if (runtime.hosts === 0)
      throw error('Dialog service requires a mounted DialogHost.')
    validate(runtime, kind, entryOptions)

    let resolve!: (outcome: DialogOutcome) => void
    let reject!: (cause: unknown) => void
    const closed = new Promise<DialogOutcome>((onResolve, onReject) => {
      resolve = onResolve
      reject = onReject
    })
    const entry = shallowReactive<DialogEntry>({
      id: ++runtime.next,
      kind,
      options: entryOptions,
      open: true,
      pending: false,
      invalid: false,
      opened: false,
      closing: false,
      done: false,
      reported: false,
      value: kind === 'prompt'
        ? (entryOptions as DialogPromptOptions).defaultValue ?? ''
        : '',
      resolve,
      reject,
      closed,
    })

    void closed.catch(() => undefined)
    entries.push(entry)
    return entry
  }

  runtime.open = open
  runtime.finish = finish
  runtime.fail = fail
  runtime.failAll = (cause) => {
    ;[...entries].reverse().forEach(entry => fail(entry, cause))
  }

  return runtime
}

function handle(runtime: DialogRuntime, entry: DialogEntry): DialogHandle {
  return {
    closed: entry.closed,
    close: () => runtime.finish(entry, 'programmatic'),
    destroy: () => runtime.finish(entry, 'destroy', true),
  }
}

/**
 * Creates one application-, Story-, or test-owned Dialog service instance.
 * The instance has no Host or DOM assumptions until a DialogHost renders it.
 */
export function createDialogService(options: DialogServiceOptions): DialogService {
  if (!options?.messages)
    throw error('createDialogService requires a Dialog message set.')
  if (typeof options.onError !== 'function')
    throw error('createDialogService requires an onError handler.')

  const fields = ['confirm', 'cancel', 'inputLabel', 'requiredError'] as const

  if (fields.some(field => !present(options.messages[field])))
    throw error('Dialog message set requires confirm, cancel, inputLabel, and requiredError.')

  const runtime = createRuntime(options)
  const service: DialogService = {
    [runtimeKey]: runtime,
    alert: (alertOptions) => {
      try {
        return runtime.open('alert', alertOptions).closed.then(() => undefined)
      }
      catch (cause) {
        return Promise.reject(cause)
      }
    },
    confirm: (confirmOptions) => {
      try {
        return runtime.open('confirm', confirmOptions).closed.then(
          outcome => outcome.reason === 'confirm',
        )
      }
      catch (cause) {
        return Promise.reject(cause)
      }
    },
    prompt: (promptOptions) => {
      try {
        const entry = runtime.open('prompt', promptOptions)

        return entry.closed.then(
          outcome => outcome.reason === 'confirm' ? entry.confirmedValue ?? entry.value : null,
        )
      }
      catch (cause) {
        return Promise.reject(cause)
      }
    },
    create: (createOptions) => {
      try {
        const entry = runtime.open('custom', createOptions)
        return handle(runtime, entry)
      }
      catch (cause) {
        return rejected(cause)
      }
    },
    closeAll: () => {
      const entries = [...runtime.entries].reverse()

      const close = (index: number) => {
        const entry = entries[index]

        if (!entry)
          return
        runtime.finish(entry, 'close-all')
        void entry.closed.then(
          () => close(index + 1),
          () => close(index + 1),
        )
      }

      close(0)
    },
  }

  return service
}

export function useDialog(): DialogService {
  const service = inject(key)

  if (!service)
    throw error('useDialog requires an ancestor DialogHost.')
  return service
}

const hostProps = {
  service: {
    type: Object as PropType<DialogService>,
    required: true,
  },
} as const

export type DialogHostProps = ExtractPublicPropTypes<typeof hostProps>

function message(runtime: DialogRuntime, entry: DialogEntry, field: keyof DialogServiceMessages) {
  return entry.options.messages?.[field] ?? runtime.messages[field]
}

function render(runtime: DialogRuntime, entry: DialogEntry, value: DialogRenderable | undefined) {
  try {
    return typeof value === 'function' ? value() : value
  }
  catch (cause) {
    fault(runtime, entry, cause)
    return null
  }
}

function cancel(runtime: DialogRuntime, entry: DialogEntry, reason: DialogCloseReason) {
  if (entry.pending || entry.done || entry.closing)
    return

  if (reason === 'cancel') {
    try {
      entry.options.onCancel?.()
    }
    catch (cause) {
      report(runtime, entry, cause)
    }
  }
  runtime.finish(entry, reason)
}

async function confirm(runtime: DialogRuntime, entry: DialogEntry) {
  if (entry.pending || entry.done || entry.closing)
    return

  const prompt = entry.kind === 'prompt'
    ? entry.options as DialogPromptOptions
    : undefined

  if (prompt?.required && !entry.value.trim()) {
    entry.invalid = true
    return
  }

  entry.invalid = false
  entry.pending = true
  const submittedValue = prompt ? entry.value : undefined
  const target = typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
    ? document.activeElement
    : undefined

  try {
    const result = prompt
      ? await prompt.onConfirm?.(submittedValue ?? '')
      : await (entry.options as DialogAlertOptions | DialogConfirmOptions | DialogCreateOptions).onConfirm?.()

    if (result === false)
      return
    if (prompt)
      entry.confirmedValue = submittedValue
    runtime.finish(entry, 'confirm')
  }
  catch (cause) {
    report(runtime, entry, cause)
  }
  finally {
    entry.pending = false
    if (!entry.closing && runtime.entries[runtime.entries.length - 1] === entry) {
      void nextTick(() => {
        if (target?.isConnected && !target.matches(':disabled'))
          target.focus({ preventScroll: true })
      })
    }
  }
}

function enter(
  runtime: DialogRuntime,
  entry: DialogEntry,
  showConfirm: boolean,
  top: boolean,
  event: KeyboardEvent,
) {
  if (
    event.key !== 'Enter'
    || event.defaultPrevented
    || event.isComposing
    || !top
    || entry.pending
    || !showConfirm
    || entry.options.confirmOnEnter === false
  ) {
    return
  }

  const target = event.target

  if (target instanceof HTMLElement && (target.matches('textarea') || target.isContentEditable))
    return

  event.preventDefault()
  event.stopPropagation()
  void confirm(runtime, entry)
}

/**
 * Provides and renders one service instance. It owns the service's Dialog Stack
 * but does not create a global instance or mount itself into document.body.
 */
export const DialogHost = defineComponent({
  name: 'DialogHost',

  props: hostProps,

  slots: Object as SlotsType<{
    default?: () => VNodeChild
  }>,

  setup(props, { slots }) {
    useModalHost('DialogHost')
    const runtime = internal(props.service)
    const id = `ui-dialog-host-${useId()}`

    if (!runtime)
      throw error('DialogHost received an invalid Dialog service.')
    if (runtime.hosts > 0)
      throw error('A Dialog service can only be mounted by one DialogHost.')

    runtime.hosts += 1
    provide(key, props.service)

    onBeforeUnmount(() => {
      runtime.hosts -= 1
      runtime.failAll(error('DialogHost was unmounted before its Dialogs settled.'))
    })

    return () => (
      <>
        {slots.default?.()}
        {runtime.entries.map((entry, index) => {
          const top = index === runtime.entries.length - 1
          const prompt = entry.kind === 'prompt'
            ? entry.options as DialogPromptOptions
            : undefined
          const multiline = prompt?.multiline || prompt?.inputType === 'textarea'
          const inputId = `${id}-${entry.id}-input`
          const errorId = `${id}-${entry.id}-error`
          const inputLabel = prompt
            ? prompt.inputLabel ?? message(runtime, entry, 'inputLabel')
            : undefined
          const requiredError = prompt
            ? prompt.requiredError ?? message(runtime, entry, 'requiredError')
            : undefined
          const confirmText = entry.options.confirmText ?? message(runtime, entry, 'confirm')
          const cancelText = entry.options.cancelText ?? message(runtime, entry, 'cancel')
          const showConfirm = entry.options.showConfirm ?? true
          const showCancel = entry.options.showCancel ?? entry.kind !== 'alert'
          const closeOnEscape = top && !entry.pending && (entry.options.closeOnEscape ?? true)
          const closeOnBackdrop = top && !entry.pending && (entry.options.closeOnBackdrop ?? true)
          const title = present(entry.options.title)
            ? render(runtime, entry, entry.options.title)
            : undefined
          const content = present(entry.options.content)
            ? render(runtime, entry, entry.options.content)
            : undefined
          const inputLabelNode = prompt
            ? render(runtime, entry, inputLabel)
            : undefined
          const requiredErrorNode = prompt?.required
            ? render(runtime, entry, requiredError)
            : undefined
          const confirmNode = showConfirm
            ? render(runtime, entry, confirmText)
            : undefined
          const cancelNode = showCancel
            ? render(runtime, entry, cancelText)
            : undefined

          if (present(entry.options.title) && !filled(title) && !entry.options.label?.trim()) {
            fault(
              runtime,
              entry,
              error('Dialog options require a title that renders accessible content or an accessible label.'),
            )
          }
          if (prompt && !filled(inputLabelNode)) {
            fault(
              runtime,
              entry,
              error('Prompt options require an input label that renders accessible content.'),
            )
          }
          if (prompt?.required && !filled(requiredErrorNode)) {
            fault(
              runtime,
              entry,
              error('Required Prompt options require an error message that renders accessible content.'),
            )
          }
          if (showConfirm && !filled(confirmNode)) {
            fault(
              runtime,
              entry,
              error('Dialog confirm text must render accessible content.'),
            )
          }
          if (showCancel && !filled(cancelNode)) {
            fault(
              runtime,
              entry,
              error('Dialog cancel text must render accessible content.'),
            )
          }

          return (
            <Dialog
              key={entry.id}
              open={entry.open}
              label={entry.options.label}
              size={entry.options.size}
              closeOnEscape={closeOnEscape}
              closeOnBackdrop={closeOnBackdrop}
              initialFocus={prompt ? `#${inputId}` : entry.options.initialFocus}
              onClose={reason => cancel(runtime, entry, reason)}
              onKeydown={event => enter(runtime, entry, showConfirm, top, event)}
              onOpened={() => {
                entry.opened = true
                try {
                  entry.options.onOpened?.()
                }
                catch (cause) {
                  report(runtime, entry, cause)
                }
              }}
              onClosed={() => {
                if (!entry.outcome || entry.done)
                  return
                entry.done = true
                const position = runtime.entries.indexOf(entry)
                if (position !== -1)
                  runtime.entries.splice(position, 1)
                entry.resolve(entry.outcome)
              }}
            >
              {{
                title: present(entry.options.title)
                  ? () => title
                  : undefined,
                default: () => (
                  <>
                    {content}
                    {prompt && (
                      <div class="mt-4">
                        <label for={inputId} class="sr-only">
                          {inputLabelNode}
                        </label>
                        {multiline
                          ? (
                              <textarea
                                id={inputId}
                                class={['textarea', 'validator', 'w-full']}
                                value={entry.value}
                                rows={prompt.rows ?? 3}
                                maxlength={prompt.maxLength}
                                placeholder={prompt.placeholder}
                                required={prompt.required}
                                aria-invalid={entry.invalid || undefined}
                                aria-describedby={entry.invalid ? errorId : undefined}
                                onInput={(event) => {
                                  entry.value = (event.currentTarget as HTMLTextAreaElement).value
                                  entry.invalid = false
                                }}
                                onKeydown={(event) => {
                                  if (
                                    event.key !== 'Enter'
                                    || event.isComposing
                                    || (!event.ctrlKey && !event.metaKey)
                                    || !showConfirm
                                    || entry.options.confirmOnEnter === false
                                  ) {
                                    return
                                  }
                                  event.preventDefault()
                                  event.stopPropagation()
                                  void confirm(runtime, entry)
                                }}
                              />
                            )
                          : (
                              <input
                                id={inputId}
                                class={['input', 'validator', 'w-full']}
                                type={prompt.inputType ?? 'text'}
                                value={entry.value}
                                maxlength={prompt.maxLength}
                                placeholder={prompt.placeholder}
                                required={prompt.required}
                                aria-invalid={entry.invalid || undefined}
                                aria-describedby={entry.invalid ? errorId : undefined}
                                onInput={(event) => {
                                  entry.value = (event.currentTarget as HTMLInputElement).value
                                  entry.invalid = false
                                }}
                              />
                            )}
                        {entry.invalid && (
                          <p id={errorId} class="mt-2 text-sm text-error" role="alert">
                            {requiredErrorNode}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ),
                actions: showConfirm || showCancel
                  ? () => (
                      <>
                        {showCancel && (
                          <Button
                            color="neutral"
                            disabled={!top || entry.pending}
                            onClick={() => cancel(runtime, entry, 'cancel')}
                          >
                            {cancelNode}
                          </Button>
                        )}
                        {showConfirm && (
                          <Button
                            color="primary"
                            disabled={!top}
                            loading={entry.pending}
                            onClick={() => void confirm(runtime, entry)}
                          >
                            {confirmNode}
                          </Button>
                        )}
                      </>
                    )
                  : undefined,
              }}
            </Dialog>
          )
        })}
      </>
    )
  },
})
