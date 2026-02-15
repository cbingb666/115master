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
    const inputRef = ref<HTMLInputElement | null>(null)

    const handleInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value
      emit('update:modelValue', value)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (props.options.required && !props.modelValue.trim()) {
          return
        }
        if (props.onConfirm) {
          props.onConfirm()
        }
      }
    }

    const focus = () => {
      if (inputRef.value) {
        inputRef.value.focus()
        if (props.modelValue) {
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

        <input
          ref={inputRef}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.3s',
          }}
          maxlength={props.options.maxLength}
          placeholder={props.options.placeholder || ''}
          required={props.options.required}
          type={props.options.inputType || 'text'}
          value={props.modelValue}
          onBlur={(e: Event) => {
            ;(e.target as HTMLInputElement).style.borderColor = '#d9d9d9'
          }}
          onFocus={(e: Event) => {
            ;(e.target as HTMLInputElement).style.borderColor = '#1890ff'
          }}
          onInput={handleInput}
          onKeydown={handleKeyDown}
        />
      </div>
    )
  },
})

export default PromptContent
