import type { PropType } from 'vue'

import type { UseDialogPromptOptions } from '@/components/Dialog/hooks/useDialog/types'
import { defineComponent, ref } from 'vue'

export default defineComponent({
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

    /** 处理键盘事件 */
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        // 如果是必填且为空，不允许确认
        if (props.options.required && !props.modelValue.trim()) {
          return
        }
        // 调用确认回调
        if (props.onConfirm) {
          props.onConfirm()
        }
      }
    }

    /** 暴露聚焦方法供外部调用 */
    const focus = () => {
      if (inputRef.value) {
        inputRef.value.focus()
        // 如果有默认值，选中全部文本
        if (props.modelValue) {
          inputRef.value.select()
        }
      }
    }

    expose({ focus })

    return () => (
      <div class="dialog-prompt-content">
        {/* 自定义内容 */}
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

        {/* 输入框 */}
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
