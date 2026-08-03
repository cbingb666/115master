import type { DialogHandle, DialogServiceMessages } from '@115master/ui'
import { Button, createDialogService, DialogHost, useDialog } from '@115master/ui'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { defineComponent, h, onBeforeUnmount, ref } from 'vue'
import preview from '../../../.storybook/preview'

const messages = {
  confirm: 'Confirm',
  cancel: 'Cancel',
  inputLabel: 'Value',
  requiredError: 'A value is required.',
} satisfies DialogServiceMessages

function service() {
  return createDialogService({
    messages,
    onError: (error) => {
      throw error
    },
  })
}

function useSettlement() {
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
    const settle = useSettlement()

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
  component: DialogHost,
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Dialog Service 将配置对象转换为由 DialogHost 承载的命令式 Dialog 流程，适合应用级 alert、confirm、prompt 与自定义协调。每个应用、Story 或测试拥有隔离实例；它不是全局单例，也不负责路由弹窗语义。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

      const open = () => {
        result.value = 'pending'
        return settle(
          dialog.alert({
            title: 'Service alert',
            content: 'The Host renders one application-owned alert.',
          }),
          () => result.value = 'acknowledged',
        )
      }

      return { dialog, open, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Default Dialog Service" class="flex items-center gap-3 p-6">
          <Button @click="open">Open alert</Button>
          <span>
            Result:
            <output aria-live="polite" data-ui-dialog-service-default>{{ result }}</output>
          </span>
        </main>
      </DialogHost>
    `,
  }),
})

Default.test('resolves an alert and restores the trigger', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open alert' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-service-default]')

  if (!result)
    throw new Error('Default Dialog Service story did not render its observable outcome')

  trigger.focus()
  await userEvent.click(trigger)
  const dialog = canvas.getByRole('dialog', { name: 'Service alert' })

  await expect(dialog).toHaveTextContent('The Host renders one application-owned alert.')
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(result).toHaveTextContent('acknowledged'))
  await waitFor(() => expect(dialog).not.toHaveAttribute('open'))
  await expect(trigger).toHaveFocus()
})

export const FactoryIsolation = meta.story({
  name: '工厂隔离与注入',
  render: () => ({
    components: { Consumer, DialogHost },
    setup: () => ({ first: service(), second: service() }),
    template: `
      <main aria-label="Dialog Service isolation" class="flex flex-wrap gap-3 p-6">
        <DialogHost :service="first">
          <Consumer name="first" />
        </DialogHost>
        <DialogHost :service="second">
          <Consumer name="second" />
        </DialogHost>
      </main>
    `,
  }),
})

FactoryIsolation.test('isolates factory instances and injects the nearest service', async ({ canvasElement }) => {
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
})

export const HostRequirement = meta.story({
  name: 'Host 要求',
  render: () => ({
    components: { Button },
    setup() {
      const dialog = service()
      const failure = ref('idle')

      const open = () => dialog.alert({
        title: 'Orphan service',
        content: 'This service has no Host.',
      }).catch((cause) => {
        failure.value = cause instanceof Error ? cause.message : String(cause)
      })

      return { failure, open }
    },
    template: `
      <main aria-label="Dialog Service Host requirement" class="flex items-center gap-3 p-6">
        <Button @click="open">Open without Host</Button>
        <output aria-live="polite" data-ui-dialog-host-error>{{ failure }}</output>
      </main>
    `,
  }),
})

HostRequirement.test('rejects a service call without a mounted Host', async ({ canvasElement }) => {
  const canvas = within(canvasElement)

  await userEvent.click(canvas.getByRole('button', { name: 'Open without Host' }))
  await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(
    'Dialog service requires a mounted DialogHost.',
  ))
})

export const Outcomes = meta.story({
  name: 'API outcomes',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

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

      return { alert, confirm, dialog, prompt, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service outcomes" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="alert">Run alert</Button>
          <Button @click="confirm">Run confirm</Button>
          <Button @click="prompt">Run prompt</Button>
          <output aria-live="polite" data-ui-dialog-outcome>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

Outcomes.test('returns alert, confirm, and prompt outcomes', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-outcome]')

  if (!result)
    throw new Error('Dialog Service outcome story did not render its output')

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
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(result).toHaveTextContent('prompt:null'))

  await userEvent.click(canvas.getByRole('button', { name: 'Run prompt' }))
  const input = canvas.getByRole('textbox', { name: 'Project name' })
  await userEvent.clear(input)
  await userEvent.type(input, 'UI package')
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(result).toHaveTextContent('prompt:UI package'))
})

export const EnterConfirmation = meta.story({
  name: 'Enter 确认',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

      const enabled = () => settle(
        dialog.confirm({
          title: 'Enter confirms',
          content: 'Enter confirms even when Cancel owns focus.',
        }),
        value => result.value = `enabled:${value}`,
      )
      const disabled = () => settle(
        dialog.confirm({
          title: 'Enter remains editable',
          content: h('label', { class: 'flex flex-col gap-2' }, [
            'Note',
            h('input', {
              'class': 'input',
              'data-ui-dialog-enter-input': '',
              'type': 'text',
            }),
          ]),
          confirmOnEnter: false,
          initialFocus: '[data-ui-dialog-enter-input]',
        }),
        value => result.value = `disabled:${value}`,
      )

      return { dialog, disabled, enabled, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service Enter confirmation" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="enabled">Open Enter-confirmed Dialog</Button>
          <Button @click="disabled">Open Enter-disabled Dialog</Button>
          <output aria-live="polite" data-ui-dialog-enter>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

EnterConfirmation.test('confirms on Enter unless the call disables it', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-enter]')

  if (!result)
    throw new Error('Dialog Service Enter story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open Enter-confirmed Dialog' }))
  await waitFor(() => expect(canvas.getByRole('button', { name: 'Cancel' })).toHaveFocus())
  await userEvent.keyboard('{Enter}')
  await waitFor(() => expect(result).toHaveTextContent('enabled:true'))

  await userEvent.click(canvas.getByRole('button', { name: 'Open Enter-disabled Dialog' }))
  const dialog = canvas.getByRole('dialog', { name: 'Enter remains editable' })
  const input = canvas.getByRole('textbox', { name: 'Note' })

  await waitFor(() => expect(input).toHaveFocus())
  await userEvent.type(input, 'Draft{Enter}')
  await expect(dialog).toHaveAttribute('open')
  await expect(result).toHaveTextContent('enabled:true')
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(result).toHaveTextContent('disabled:true'))
})

export const CloseReasons = meta.story({
  name: '结构化关闭原因',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const active = ref<DialogHandle>()
      const dialog = service()
      const result = ref('idle')
      const settlements = ref(0)
      const settle = useSettlement()

      const open = (title: string) => {
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
      const synchronous = () => {
        const handle = dialog.create({
          title: 'Synchronous close',
          content: 'This handle closes before the primitive opens.',
        })

        handle.close()
        return settle(handle.closed, (outcome) => {
          result.value = `synchronous:${outcome.reason}`
        })
      }

      return { active, dialog, open, result, synchronous }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service close reasons" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="open('Custom confirm')">Custom confirm</Button>
          <Button @click="open('Custom cancel')">Custom cancel</Button>
          <Button @click="open('Custom escape')">Custom escape</Button>
          <Button @click="open('Custom backdrop')">Custom backdrop</Button>
          <Button @click="open('Custom programmatic')">Custom programmatic</Button>
          <Button @click="open('Custom destroy')">Custom destroy</Button>
          <Button @click="active?.close()">Close active</Button>
          <Button @click="active?.destroy()">Destroy active</Button>
          <Button @click="synchronous">Create and close synchronously</Button>
          <output aria-live="polite" data-ui-dialog-reason>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

CloseReasons.test('reports each public close reason exactly once', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-reason]')

  if (!result)
    throw new Error('Dialog Service close reason story did not render its output')

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

export const ErrorHandling = meta.story({
  name: '错误处理',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const calls = ref(0)
      const failure = ref('none')
      const result = ref('idle')
      const dialog = createDialogService({
        messages,
        onError: (cause) => {
          calls.value += 1
          failure.value = cause instanceof Error ? cause.message : String(cause)
        },
      })

      const renderError = () => {
        calls.value = 0
        failure.value = 'none'
        result.value = 'idle'
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
      const emptyTitle = () => {
        calls.value = 0
        failure.value = 'none'
        result.value = 'idle'
        const handle = dialog.create({
          title: () => null,
          content: 'This must never open without an accessible name.',
        })

        void handle.closed.catch((cause) => {
          result.value = cause instanceof Error ? `rejected:${cause.message}` : 'rejected'
        })
      }
      const emptyLabel = () => {
        calls.value = 0
        failure.value = 'none'
        result.value = 'idle'
        void dialog.prompt({
          title: 'Empty input label',
          inputLabel: () => null,
        }).catch((cause) => {
          result.value = cause instanceof Error ? `rejected:${cause.message}` : 'rejected'
        })
      }
      const confirmError = () => {
        calls.value = 0
        failure.value = 'none'
        result.value = 'idle'
        dialog.create({
          title: 'Confirmation failure',
          content: 'The Dialog remains open after the caller handler fails.',
          onConfirm: () => {
            throw new Error('confirm failed')
          },
        })
      }

      return {
        calls,
        confirmError,
        dialog,
        emptyLabel,
        emptyTitle,
        failure,
        renderError,
        result,
      }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service errors" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="renderError">Throw while rendering</Button>
          <Button @click="emptyTitle">Render an empty title</Button>
          <Button @click="emptyLabel">Render an empty input label</Button>
          <Button @click="confirmError">Throw while confirming</Button>
          <output aria-live="polite" data-ui-dialog-error>{{ failure }}:{{ calls }}</output>
          <output aria-live="polite" data-ui-dialog-rejection>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

ErrorHandling.test('reports render and confirmation failures through caller-owned outcomes', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const failure = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-error]')
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-rejection]')

  if (!failure || !result)
    throw new Error('Dialog Service error story did not render its outputs')

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
  const dialog = canvas.getByRole('dialog', { name: 'Confirmation failure' })
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(failure).toHaveTextContent('confirm failed:1'))
  await expect(dialog).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
})

export const AsyncConfirmation = meta.story({
  name: '异步确认与 pending',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const active = ref<DialogHandle>()
      const calls = ref(0)
      const dialog = service()
      const release = ref<(value: false) => void>()
      const result = ref('idle')
      const settle = useSettlement()

      const open = () => {
        calls.value = 0
        result.value = 'pending'
        const handle = dialog.create({
          title: 'Pending confirmation',
          content: 'User close paths lock while the Promise is pending.',
          confirmText: 'Start request',
          onConfirm: () => {
            calls.value += 1
            return new Promise<false>((resolve) => {
              release.value = resolve
            })
          },
        })
        active.value = handle
        return settle(handle.closed, (outcome) => {
          result.value = outcome.reason
        })
      }

      return { active, calls, dialog, open, release, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service pending confirmation" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="open">Open pending Dialog</Button>
          <Button @click="active?.close()">Programmatic close</Button>
          <Button @click="release?.(false)">Release request</Button>
          <output aria-live="polite" data-ui-dialog-async>{{ result }}:{{ calls }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

AsyncConfirmation.test('locks user close paths while pending and settles once', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-async]')

  if (!result)
    throw new Error('Dialog Service pending story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open pending Dialog' }))
  const dialog = canvas.getByRole('dialog', { name: 'Pending confirmation' })
  const submit = canvas.getByRole('button', { name: 'Start request' })
  const cancel = canvas.getByRole('button', { name: 'Cancel' })

  await userEvent.click(submit)
  await expect(submit).toHaveAttribute('aria-busy', 'true')
  await expect(cancel).toBeDisabled()
  await userEvent.keyboard('{Enter}')
  await userEvent.keyboard('{Escape}')
  await userEvent.click(dialog)
  await expect(dialog).toHaveAttribute('open')
  await expect(result).toHaveTextContent('pending:1')

  await userEvent.click(canvas.getByRole('button', { name: 'Programmatic close' }))
  await waitFor(() => expect(result).toHaveTextContent('programmatic:1'))
  await userEvent.click(canvas.getByRole('button', { name: 'Release request' }))
})

export const PromptValidation = meta.story({
  name: 'Prompt 必填校验',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

      const open = () => settle(
        dialog.prompt({
          title: 'Required text',
          inputLabel: 'File name',
          required: true,
          requiredError: 'Enter a file name.',
        }),
        value => result.value = `text:${value ?? 'null'}`,
      )

      return { dialog, open, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service Prompt validation" class="flex items-center gap-3 p-6">
          <Button @click="open">Open required Prompt</Button>
          <output aria-live="polite" data-ui-dialog-prompt-validation>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

PromptValidation.test('announces a required error and submits the corrected value', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-prompt-validation]')

  if (!result)
    throw new Error('Dialog Service Prompt validation story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open required Prompt' }))
  const input = canvas.getByRole('textbox', { name: 'File name' })
  await userEvent.type(input, '{Enter}')
  await expect(canvas.getByRole('alert')).toHaveTextContent('Enter a file name.')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await userEvent.type(input, 'video.mp4{Enter}')
  await waitFor(() => expect(result).toHaveTextContent('text:video.mp4'))
})

export const PromptKeyboard = meta.story({
  name: 'Prompt 键盘路径',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

      const multiline = () => settle(
        dialog.prompt({
          title: 'Multiline text',
          inputLabel: 'Notes',
          multiline: true,
          rows: 4,
        }),
        value => result.value = `multiline:${value ?? 'null'}`,
      )
      const disabled = () => settle(
        dialog.prompt({
          title: 'Enter-disabled text',
          inputLabel: 'Disabled value',
          confirmOnEnter: false,
        }),
        value => result.value = `disabled:${value ?? 'null'}`,
      )

      return { dialog, disabled, multiline, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service Prompt keyboard" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="multiline">Open multiline Prompt</Button>
          <Button @click="disabled">Open Enter-disabled Prompt</Button>
          <output aria-live="polite" data-ui-dialog-prompt-keyboard>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

PromptKeyboard.test('preserves multiline Enter and honors confirmOnEnter', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-prompt-keyboard]')

  if (!result)
    throw new Error('Dialog Service Prompt keyboard story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open multiline Prompt' }))
  const textarea = canvas.getByRole('textbox', { name: 'Notes' })
  await userEvent.type(textarea, 'line one{Enter}line two')
  await expect(canvas.getByRole('dialog', { name: 'Multiline text' })).toHaveAttribute('open')
  await userEvent.keyboard('{Control>}{Enter}{/Control}')
  await waitFor(() => expect(result).toHaveTextContent('multiline:line one'))
  await expect(result).toHaveTextContent('line two')

  await userEvent.click(canvas.getByRole('button', { name: 'Open Enter-disabled Prompt' }))
  const input = canvas.getByRole('textbox', { name: 'Disabled value' })
  await userEvent.type(input, 'stay open{Enter}')
  await userEvent.keyboard('{Control>}{Enter}{/Control}')
  await expect(canvas.getByRole('dialog', { name: 'Enter-disabled text' })).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Confirm' }))
  await waitFor(() => expect(result).toHaveTextContent('disabled:stay open'))
})

export const SubmittedSnapshot = meta.story({
  name: 'Prompt 提交快照',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const release = ref<() => void>()
      const result = ref('idle')
      const settle = useSettlement()

      const open = () => settle(
        dialog.prompt({
          title: 'Async Prompt snapshot',
          inputLabel: 'Submitted value',
          defaultValue: 'A',
          onConfirm: () => new Promise<void>((resolve) => {
            release.value = resolve
          }),
        }),
        value => result.value = `snapshot:${value ?? 'null'}`,
      )

      return { dialog, open, release, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service Prompt snapshot" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="open">Open async Prompt</Button>
          <Button @click="release?.()">Release async Prompt</Button>
          <output aria-live="polite" data-ui-dialog-prompt-snapshot>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

SubmittedSnapshot.test('returns the submitted value captured before async confirmation', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-prompt-snapshot]')

  if (!result)
    throw new Error('Dialog Service Prompt snapshot story did not render its output')

  await userEvent.click(canvas.getByRole('button', { name: 'Open async Prompt' }))
  const input = canvas.getByRole('textbox', { name: 'Submitted value' })
  const confirm = canvas.getByRole('button', { name: 'Confirm' })
  await userEvent.click(confirm)
  await expect(confirm).toHaveAttribute('aria-busy', 'true')
  await userEvent.clear(input)
  await userEvent.type(input, 'B')
  await userEvent.click(canvas.getByRole('button', { name: 'Release async Prompt' }))
  await waitFor(() => expect(result).toHaveTextContent('snapshot:A'))
})

export const Stack = meta.story({
  name: 'Stack 与焦点恢复',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const result = ref('idle')
      const settle = useSettlement()

      const open = () => {
        const handle = dialog.create({
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

        return settle(handle.closed, outcome => result.value = outcome.reason)
      }

      return { dialog, open, result }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service Stack" class="flex items-center gap-3 p-6">
          <Button @click="open">Open nested flow</Button>
          <output aria-live="polite" data-ui-dialog-stack>{{ result }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

Stack.test('keeps only the top Dialog interactive and restores parent focus', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open nested flow' })
  const result = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-stack]')

  if (!result)
    throw new Error('Dialog Service Stack story did not render its output')

  await userEvent.click(trigger)
  const parent = canvas.getByRole('dialog', { name: 'Parent Dialog' })
  const confirm = canvas.getByRole('button', { name: 'Open nested feedback' })
  await userEvent.click(confirm)
  const child = canvas.getByRole('dialog', { name: 'Nested feedback' })

  await expect(confirm).toBeDisabled()
  await expect(child).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Return to parent' }))
  await waitFor(() => expect(child).not.toHaveAttribute('open'))
  await waitFor(() => expect(confirm).not.toBeDisabled())
  await waitFor(() => expect(confirm).toHaveFocus())
  await expect(parent).toHaveAttribute('open')
  await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
  await waitFor(() => expect(result).toHaveTextContent('cancel'))
  await expect(trigger).toHaveFocus()
})

export const CloseAll = meta.story({
  name: 'closeAll LIFO',
  render: () => ({
    components: { Button, DialogHost },
    setup() {
      const dialog = service()
      const order = ref<string[]>([])
      const settle = useSettlement()

      const open = () => {
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

      return { dialog, open, order }
    },
    template: `
      <DialogHost :service="dialog">
        <main aria-label="Dialog Service closeAll" class="flex flex-wrap items-center gap-3 p-6">
          <Button @click="open">Open three Dialogs</Button>
          <Button @click="dialog.closeAll()">Close all Dialogs</Button>
          <output aria-live="polite" data-ui-dialog-order>{{ order.join(',') }}</output>
        </main>
      </DialogHost>
    `,
  }),
})

CloseAll.test('closes the Stack in LIFO order and restores the trigger', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const trigger = canvas.getByRole('button', { name: 'Open three Dialogs' })
  const order = canvasElement.querySelector<HTMLOutputElement>('[data-ui-dialog-order]')

  if (!order)
    throw new Error('Dialog Service closeAll story did not render its order output')

  await userEvent.click(trigger)
  await waitFor(() => expect(canvas.getAllByRole('dialog')).toHaveLength(3))
  await userEvent.click(canvas.getByRole('button', { name: 'Close all Dialogs' }))
  await waitFor(() => expect(order).toHaveTextContent(
    'third:close-all,second:close-all,first:close-all',
  ))
  await waitFor(() => expect(canvas.queryAllByRole('dialog')).toHaveLength(0))
  await expect(trigger).toHaveFocus()
})
