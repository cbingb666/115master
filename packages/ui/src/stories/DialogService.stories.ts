import type { DialogHandle, DialogServiceMessages } from '@115master/ui'
import { Button, createDialogService, DialogHost, useDialog } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { defineComponent, h, onBeforeUnmount, ref } from 'vue'
import preview from '../../.storybook/preview'

const messages: DialogServiceMessages = {
  confirm: 'Confirm',
  cancel: 'Cancel',
  inputLabel: 'Value',
  requiredError: 'A value is required.',
}

function service() {
  return createDialogService({
    messages,
    onError: (error) => {
      throw error
    },
  })
}

function useMountedPromise() {
  const mounted = ref(true)
  onBeforeUnmount(() => mounted.value = false)

  return <T>(promise: Promise<T>, apply: (value: T) => void) => promise.then(
    (value) => {
      if (mounted.value)
        apply(value)
    },
    (cause) => {
      if (mounted.value)
        throw cause
    },
  )
}

const Consumer = defineComponent({
  name: 'DialogServiceConsumer',

  props: {
    name: {
      type: String,
      required: true,
    },
  },

  setup(props) {
    const dialog = useDialog()
    const settle = useMountedPromise()

    return () => h(Button, {
      onClick: () => settle(
        dialog.alert({
          title: `${props.name} service`,
          content: `Opened from ${props.name}.`,
        }),
        () => undefined,
      ),
    }, () => `Open ${props.name}`)
  },
})

const meta = preview.meta({
  title: 'UI/Dialog Service',
  parameters: {
    docs: {
      description: {
        component:
          '工厂创建的 Dialog 服务由当前 DialogHost 承载。每个应用、Story 与测试持有隔离实例，组件通过 useDialog 注入访问当前实例。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const FactoryIsolationAndInjection = meta.story({
  name: '工厂隔离、注入与 Host 故障',
  render: () => ({
    components: { Consumer, DialogHost },
    setup() {
      const first = service()
      const second = service()
      const orphan = service()
      const failure = ref('none')

      const openOrphan = async () => {
        try {
          await orphan.alert({
            title: 'Orphan service',
            content: 'This service has no Host.',
          })
        }
        catch (error) {
          failure.value = error instanceof Error ? error.message : String(error)
        }
      }

      return { failure, first, openOrphan, second }
    },
    template: `
      <main aria-label="Dialog service isolation" class="flex flex-wrap gap-3 p-6">
        <DialogHost :service="first">
          <Consumer name="first" />
        </DialogHost>
        <DialogHost :service="second">
          <Consumer name="second" />
        </DialogHost>
        <button type="button" class="btn" @click="openOrphan">Open without Host</button>
        <output aria-live="polite" data-ui-dialog-host-error>{{ failure }}</output>
      </main>
    `,
  }),
})

FactoryIsolationAndInjection.test('proves factory isolation, injection, and missing Host failure', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Open first' }))
  const first = canvas.getByRole('dialog', { name: 'first service' })

  await expect(first).toHaveTextContent('Opened from first.')
  await expect(canvas.queryByRole('dialog', { name: 'second service' })).not.toBeInTheDocument()
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(first).not.toHaveAttribute('open'))

  await userEvent.click(canvas.getByRole('button', { name: 'Open second' }))
  const second = canvas.getByRole('dialog', { name: 'second service' })

  await expect(second).toHaveTextContent('Opened from second.')
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(second).not.toHaveAttribute('open'))

  await userEvent.click(canvas.getByRole('button', { name: 'Open without Host' }))
  await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Dialog service requires a mounted DialogHost.'))
})

export const OutcomesAndCloseReasons = meta.story({
  name: 'API outcomes 与关闭原因',
  render: () => ({
    components: { DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const active = ref<DialogHandle>()
      const settlements = ref(0)
      const settle = useMountedPromise()

      const alert = () => settle(
        dialog.alert({
          title: 'Alert outcome',
          content: 'Alert resolves without a value.',
          confirmText: 'Acknowledge alert',
        }),
        () => result.value = 'alert:void',
      )
      const confirm = () => settle(
        dialog.confirm({
          title: 'Confirm outcome',
          content: 'Choose a boolean outcome.',
          confirmText: 'Accept choice',
          cancelText: 'Decline choice',
        }),
        value => result.value = `confirm:${value}`,
      )
      const prompt = () => settle(
        dialog.prompt({
          title: 'Prompt outcome',
          inputLabel: 'Project name',
          defaultValue: 'Foundation',
        }),
        value => result.value = `prompt:${value ?? 'null'}`,
      )
      const custom = (title: string) => {
        settlements.value = 0
        const handle = dialog.create({
          title,
          content: 'Observe the structured close reason.',
        })
        active.value = handle
        return settle(handle.closed, (outcome) => {
          settlements.value += 1
          result.value = `${outcome.reason}:${settlements.value}`
        })
      }
      const closeSynchronously = () => {
        const handle = dialog.create({
          title: 'Synchronous close',
          content: 'This handle closes before the primitive opens.',
        })

        handle.close()
        return settle(handle.closed, (outcome) => {
          result.value = `synchronous:${outcome.reason}`
        })
      }

      return {
        active,
        alert,
        closeSynchronously,
        confirm,
        custom,
        dialog,
        prompt,
        result,
      }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog service outcomes" class="flex flex-wrap gap-3 p-6">
          <button type="button" class="btn" @click="alert">Run alert</button>
          <button type="button" class="btn" @click="confirm">Run confirm</button>
          <button type="button" class="btn" @click="prompt">Run prompt</button>
          <button type="button" class="btn" @click="custom('Custom confirm')">Custom confirm</button>
          <button type="button" class="btn" @click="custom('Custom cancel')">Custom cancel</button>
          <button type="button" class="btn" @click="custom('Custom escape')">Custom escape</button>
          <button type="button" class="btn" @click="custom('Custom backdrop')">Custom backdrop</button>
          <button type="button" class="btn" @click="custom('Custom programmatic')">Custom programmatic</button>
          <button type="button" class="btn" @click="custom('Custom destroy')">Custom destroy</button>
          <button type="button" class="btn" @click="active?.close()">Close active</button>
          <button type="button" class="btn" @click="active?.destroy()">Destroy active</button>
          <button type="button" class="btn" @click="closeSynchronously">Create and close synchronously</button>
          <output aria-live="polite" data-ui-dialog-outcome>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

OutcomesAndCloseReasons.test('proves API outcomes and structured close reasons', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-outcome]')

  if (!result)
    throw new Error('Dialog outcome story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Run alert' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Acknowledge alert' }))
  await waitFor(() => expect(result).toHaveTextContent('alert:void'))

  await userEvent.click(canvas.getByRole('button', { name: 'Run confirm' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Decline choice' }))
  await waitFor(() => expect(result).toHaveTextContent('confirm:false'))

  await userEvent.click(canvas.getByRole('button', { name: 'Run confirm' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Accept choice' }))
  await waitFor(() => expect(result).toHaveTextContent('confirm:true'))

  await userEvent.click(canvas.getByRole('button', { name: 'Run prompt' }))
  const input = canvas.getByRole('textbox', { name: 'Project name' })
  await userEvent.clear(input)
  await userEvent.type(input, 'UI package{Enter}')
  await waitFor(() => expect(result).toHaveTextContent('prompt:UI package'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom confirm' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(result).toHaveTextContent('confirm:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom cancel' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(result).toHaveTextContent('cancel:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom escape' }))
  await userEvent.keyboard('{Escape}')
  await waitFor(() => expect(result).toHaveTextContent('escape:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom backdrop' }))
  await userEvent.click(canvas.getByRole('dialog', { name: 'Custom backdrop' }))
  await waitFor(() => expect(result).toHaveTextContent('backdrop:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom programmatic' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Close active' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Destroy active' }))
  await waitFor(() => expect(result).toHaveTextContent('programmatic:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Custom destroy' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Destroy active' }))
  await waitFor(() => expect(result).toHaveTextContent('destroy:1'))

  await userEvent.click(canvas.getByRole('button', { name: 'Create and close synchronously' }))
  await waitFor(() => expect(result).toHaveTextContent('synchronous:programmatic'))
})

export const ErrorsAndAsyncConfirmation = meta.story({
  name: 'render/onConfirm 错误与 pending',
  render: () => ({
    components: { DialogHost },
    setup() {
      const failure = ref('none')
      const failureCalls = ref(0)
      const result = ref('idle')
      const calls = ref(0)
      const active = ref<DialogHandle>()
      const settle = useMountedPromise()
      let release: ((value: false) => void) | undefined
      const dialog = createDialogService({
        messages,
        onError: (cause) => {
          failureCalls.value += 1
          failure.value = cause instanceof Error ? cause.message : String(cause)
        },
      })

      const renderError = () => {
        failure.value = 'none'
        failureCalls.value = 0
        const handle = dialog.create({
          title: 'Render failure',
          content: () => {
            throw new Error('render failed')
          },
        })
        void handle.closed.catch((cause) => {
          result.value = cause instanceof Error ? `rejected:${cause.message}` : 'rejected'
        })
      }
      const confirmError = () => {
        failure.value = 'none'
        failureCalls.value = 0
        dialog.create({
          title: 'Confirmation failure',
          content: 'The Dialog remains open after the caller handler fails.',
          onConfirm: () => {
            throw new Error('confirm failed')
          },
        })
      }
      const pending = () => {
        calls.value = 0
        result.value = 'pending'
        const handle = dialog.create({
          title: 'Pending confirmation',
          content: 'User close paths lock while the Promise is pending.',
          confirmText: 'Start request',
          onConfirm: () => {
            calls.value += 1
            return new Promise<false>((resolve) => {
              release = resolve
            })
          },
        })
        active.value = handle
        return settle(handle.closed, (outcome) => {
          result.value = outcome.reason
        })
      }
      const emptyTitle = () => {
        failure.value = 'none'
        failureCalls.value = 0
        const handle = dialog.create({
          title: () => null,
          content: 'This must never open without an accessible name.',
        })

        void handle.closed.catch((cause) => {
          result.value = cause instanceof Error ? `rejected:${cause.message}` : 'rejected'
        })
      }
      const emptyInputLabel = () => {
        failure.value = 'none'
        failureCalls.value = 0
        void dialog.prompt({
          title: 'Empty input label',
          inputLabel: () => null,
        }).catch((cause) => {
          result.value = cause instanceof Error ? `rejected:${cause.message}` : 'rejected'
        })
      }
      const releaseRequest = () => release?.(false)

      return {
        active,
        calls,
        confirmError,
        dialog,
        emptyInputLabel,
        emptyTitle,
        failure,
        failureCalls,
        pending,
        releaseRequest,
        renderError,
        result,
      }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog service failures" class="flex flex-wrap gap-3 p-6">
          <button type="button" class="btn" @click="renderError">Throw while rendering</button>
          <button type="button" class="btn" @click="emptyTitle">Render an empty title</button>
          <button type="button" class="btn" @click="emptyInputLabel">Render an empty input label</button>
          <button type="button" class="btn" @click="confirmError">Throw while confirming</button>
          <button type="button" class="btn" @click="pending">Open pending Dialog</button>
          <button type="button" class="btn" @click="active?.close()">Programmatic close</button>
          <button type="button" class="btn" @click="releaseRequest">Release request</button>
          <output aria-live="polite" data-ui-dialog-error>{{ failure }}:{{ failureCalls }}</output>
          <output aria-live="polite" data-ui-dialog-async>{{ result }}:{{ calls }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

ErrorsAndAsyncConfirmation.test('proves render and confirmation errors plus pending protection', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const failure = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-error]')
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-async]')

  if (!failure || !result)
    throw new Error('Dialog failure story did not render its outputs')

  await userEvent.click(canvas.getByRole('button', { name: 'Throw while rendering' }))
  await waitFor(() => expect(failure).toHaveTextContent('render failed:1'))
  await waitFor(() => expect(result).toHaveTextContent('rejected:render failed'))

  await userEvent.click(canvas.getByRole('button', { name: 'Render an empty title' }))
  await waitFor(() => expect(failure).toHaveTextContent(
    'Dialog options require a title that renders accessible content or an accessible label.:1',
  ))
  await waitFor(() => expect(result).toHaveTextContent(
    'rejected:Dialog options require a title that renders accessible content or an accessible label.',
  ))

  await userEvent.click(canvas.getByRole('button', { name: 'Render an empty input label' }))
  await waitFor(() => expect(failure).toHaveTextContent(
    'Prompt options require an input label that renders accessible content.:1',
  ))
  await waitFor(() => expect(result).toHaveTextContent(
    'rejected:Prompt options require an input label that renders accessible content.',
  ))

  await userEvent.click(canvas.getByRole('button', { name: 'Throw while confirming' }))
  const failed = canvas.getByRole('dialog', { name: 'Confirmation failure' })
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(failure).toHaveTextContent('confirm failed:1'))
  await expect(failed).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))

  await userEvent.click(canvas.getByRole('button', { name: 'Open pending Dialog' }))
  const pending = canvas.getByRole('dialog', { name: 'Pending confirmation' })
  const submit = canvas.getByRole('button', { name: 'Start request' })
  const cancel = canvas.getByRole('button', { name: 'Cancel' })

  await userEvent.click(submit)
  await expect(submit).toHaveAttribute('aria-busy', 'true')
  await expect(cancel).toBeDisabled()
  await userEvent.keyboard('{Escape}')
  await userEvent.click(pending)
  await expect(pending).toHaveAttribute('open')
  await expect(result).toHaveTextContent('pending:1')

  await userEvent.click(canvas.getByRole('button', { name: 'Programmatic close' }))
  await waitFor(() => expect(result).toHaveTextContent('programmatic:1'))
  await userEvent.click(canvas.getByRole('button', { name: 'Release request' }))
})

export const PromptKeyboardAndValidation = meta.story({
  name: 'Prompt 键盘与校验',
  render: () => ({
    components: { DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useMountedPromise()
      let release: (() => void) | undefined
      const text = () => settle(
        dialog.prompt({
          title: 'Required text',
          inputLabel: 'File name',
          required: true,
          requiredError: 'Enter a file name.',
        }),
        value => result.value = `text:${value ?? 'null'}`,
      )
      const multiline = () => settle(
        dialog.prompt({
          title: 'Multiline text',
          inputLabel: 'Notes',
          multiline: true,
          rows: 4,
        }),
        value => result.value = `multiline:${value ?? 'null'}`,
      )
      const asyncPrompt = () => settle(
        dialog.prompt({
          title: 'Async Prompt snapshot',
          inputLabel: 'Submitted value',
          defaultValue: 'A',
          onConfirm: () => new Promise<void>((resolve) => {
            release = resolve
          }),
        }),
        value => result.value = `snapshot:${value ?? 'null'}`,
      )
      const releasePrompt = () => release?.()

      return { asyncPrompt, dialog, multiline, releasePrompt, result, text }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Prompt behavior" class="flex flex-wrap gap-3 p-6">
          <button type="button" class="btn" @click="text">Open required Prompt</button>
          <button type="button" class="btn" @click="multiline">Open multiline Prompt</button>
          <button type="button" class="btn" @click="asyncPrompt">Open async Prompt</button>
          <button type="button" class="btn" @click="releasePrompt">Release async Prompt</button>
          <output aria-live="polite" data-ui-dialog-prompt>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

PromptKeyboardAndValidation.test('proves Prompt keyboard paths, validation, and submitted snapshots', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-prompt]')

  if (!result)
    throw new Error('Prompt story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open required Prompt' }))
  const input = canvas.getByRole('textbox', { name: 'File name' })
  await userEvent.type(input, '{Enter}')
  await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a file name.')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await userEvent.type(input, 'video.mp4{Enter}')
  await waitFor(() => expect(result).toHaveTextContent('text:video.mp4'))

  await userEvent.click(canvas.getByRole('button', { name: 'Open multiline Prompt' }))
  const textarea = canvas.getByRole('textbox', { name: 'Notes' })
  await userEvent.type(textarea, 'line one{Enter}line two')
  await expect(canvas.getByRole('dialog', { name: 'Multiline text' })).toHaveAttribute('open')
  await userEvent.keyboard('{Control>}{Enter}{/Control}')
  await waitFor(() => expect(result).toHaveTextContent('multiline:line one'))
  await expect(result).toHaveTextContent('line two')

  await userEvent.click(canvas.getByRole('button', { name: 'Open required Prompt' }))
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(result).toHaveTextContent('text:null'))

  await userEvent.click(canvas.getByRole('button', { name: 'Open async Prompt' }))
  const submitted = canvas.getByRole('textbox', { name: 'Submitted value' })
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await userEvent.clear(submitted)
  await userEvent.type(submitted, 'B')
  await userEvent.click(canvas.getByRole('button', { name: 'Release async Prompt' }))
  await waitFor(() => expect(result).toHaveTextContent('snapshot:A'))
})

export const StackAndCloseAll = meta.story({
  name: 'Stack、焦点恢复与 closeAll LIFO',
  render: () => ({
    components: { DialogHost },
    setup() {
      const dialog = service()
      const order = ref<string[]>([])
      const settle = useMountedPromise()

      const nested = () => {
        dialog.create({
          title: 'Parent Dialog',
          content: 'The parent remains open after nested feedback.',
          confirmText: 'Open nested feedback',
          onConfirm: async () => {
            await dialog.alert({
              title: 'Nested feedback',
              content: 'Only this top Dialog is interactive.',
              confirmText: 'Return to parent',
            })
            return false as const
          },
        })
      }
      const stack = () => {
        order.value = []
        ;['first', 'second', 'third'].forEach((name) => {
          const handle = dialog.create({
            title: `${name} stacked Dialog`,
            content: `${name} outcome`,
          })
          void settle(handle.closed, (outcome) => {
            order.value.push(`${name}:${outcome.reason}`)
          })
        })
      }

      return { dialog, nested, order, stack }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog service Stack" class="flex flex-wrap gap-3 p-6">
          <button type="button" class="btn" @click="nested">Open nested flow</button>
          <button type="button" class="btn" @click="stack">Open three Dialogs</button>
          <button type="button" class="btn" @click="dialog.closeAll()">Close all Dialogs</button>
          <output aria-live="polite" data-ui-dialog-order>{{ order.join(',') }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

StackAndCloseAll.test('proves Stack focus restoration and closeAll LIFO', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const order = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-order]')

  if (!order)
    throw new Error('Dialog Stack story did not render its order output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open nested flow' }))
  const parent = canvas.getByRole('dialog', { name: 'Parent Dialog' })
  const parentConfirm = canvas.getByRole('button', { name: 'Open nested feedback' })
  await userEvent.click(parentConfirm)
  const child = canvas.getByRole('dialog', { name: 'Nested feedback' })

  await expect(parentConfirm).toBeDisabled()
  await expect(child).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Return to parent' }))
  await waitFor(() => expect(child).not.toHaveAttribute('open'))
  await waitFor(() => expect(parentConfirm).not.toBeDisabled())
  await waitFor(() => expect(parentConfirm).toHaveFocus())
  await expect(parent).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))

  const trigger = canvas.getByRole('button', { name: 'Open three Dialogs' })
  await userEvent.click(trigger)
  await waitFor(() => expect(canvas.getAllByRole('dialog')).toHaveLength(3))
  await userEvent.click(canvas.getByRole('button', { name: 'Close all Dialogs' }))
  await waitFor(() => expect(order).toHaveTextContent(
    'third:close-all,second:close-all,first:close-all',
  ))
  await waitFor(() => expect(canvas.queryAllByRole('dialog')).toHaveLength(0))
  await waitFor(() => expect(trigger).toHaveFocus())
})
