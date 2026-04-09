import type { PropType } from 'vue'

import type { UseDialogPromptOptions } from './types'
import { defineComponent, ref } from 'vue'

const PromptContent = defineComponent({
  name: 'PromptContent',
  props: {
    options: {
      type: Object as PropType<UseDialogPromptOptions>,
      required: true,
    },
    modelValue: {
      type: String,
      default: '',
    },
    onConfirm: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit, expose }) {
    const inputRef = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
    const isMultiline = props.options.multiline || props.options.inputType === 'textarea'

    const handleInput = (e: Event) => {
      const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value
      emit('update:modelValue', value)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter')
        return
      if (isMultiline && e.shiftKey)
        return

      e.preventDefault()
      if (props.options.required && !props.modelValue.trim()) {
        return
      }
      if (props.onConfirm) {
        props.onConfirm()
      }
    }

    const focus = () => {
      if (inputRef.value) {
        inputRef.value.focus()
        if (!isMultiline && props.modelValue) {
          inputRef.value.select()
        }
      }
    }

    expose({ focus })

    return () => (
      <div class="dialog-prompt-content">
        {props.options.content && (
          <div class="dialog-prompt-message" style={{ marginBottom: '16px' }}>
            {typeof props.options.content === 'string'
              ? (
                  <div>{props.options.content}</div>
                )
              : typeof props.options.content === 'function'
                ? (
                    (props.options.content as () => any)()
                  )
                : (
                    props.options.content
                  )}
          </div>
        )}

        {isMultiline
          ? (
              <textarea
                ref={inputRef}
                name="prompt-input"
                class="textarea bg-base-content/10 textarea-ghost w-full"
                maxlength={props.options.maxLength}
                placeholder={props.options.placeholder || ''}
                required={props.options.required}
                rows={props.options.rows || 3}
                value={props.modelValue}
                onInput={handleInput}
                onKeydown={handleKeyDown}
              />
            )
          : (
              <input
                ref={inputRef}
                name="prompt-input"
                class="input bg-base-content/10 input-ghost w-full"
                maxlength={props.options.maxLength}
                placeholder={props.options.placeholder || ''}
                required={props.options.required}
                type={props.options.inputType || 'text'}
                value={props.modelValue}
                onInput={handleInput}
                onKeydown={handleKeyDown}
              />
            )}
      </div>
    )
  },
})

export default PromptContent
