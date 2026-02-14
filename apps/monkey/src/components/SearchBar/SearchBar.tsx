import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, shallowRef, useModel, watch } from 'vue'
import { clsx } from '@/utils/clsx'

/** 样式常量定义 */
const styles = clsx({
  // 容器样式
  container: [
    'group',
    'relative',
    'z-1000',
    'flex',
    'flex-col',
    'justify-center',
    'flex-1',
    'h-11',
    'ml-4',
    'bg-base-content/10',
    'border-1',
    'border-base-content/0',
    'rounded-full',
    'sm:flex-none',
    'sm:w-168',
    'focus-within:border-primary',
  ],
  // 前缀
  preffix: [
    'flex-none',
    'text-2xl',
    'text-base-content',
  ],
  // 后缀
  suffix: [
    'flex-none',
    'opacity-50',
    'group-focus-within:opacity-100',
  ],
  // 前缀图标
  preffixIcon: [
    'text-2xl',
    'text-base-content',
  ],
  // 后缀图标
  suffixIcon: [
    'text-2xl',
    'text-base-content',
  ],
  // label
  label: [
    'relative',
    'z-1',
    'w-full',
    'px-4',
    'py-1.5',
    'flex',
    'items-center',
    'gap-2',
  ],
  // input
  input: [
    'w-full',
    'h-full',
    'outline-none',
  ],

})

const SearchBar = defineComponent({
  name: 'SearchBar',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    onUpdateModelValue: {
      type: Function as PropType<(value: string) => void>,
    },
    /**
     * 处理回车事件
     */
    onEnter: {
      type: Function as PropType<(value: string) => void>,
    },
  },
  setup: (props) => {
    const inputValue = useModel(props, 'modelValue')

    /** 输入框引用 */
    const inputRef = shallowRef<HTMLInputElement>()

    /** 搜索框占位符 */
    const searchPlaceholder = computed(() => {
      return '搜索 ⌘+K'
    })
    const keys = useMagicKeys()
    watch(keys['Meta+K'], (value) => {
      if (value) {
        inputRef.value?.focus()
        inputRef.value?.select()
      }
    })

    /** 处理回车 */
    function handleEnter() {
      if (inputValue.value) {
        props.onEnter?.(inputValue.value)
      }
    }

    /** 处理清除 */
    function handleClear() {
      inputValue.value = ''
    }

    return () => (
      <div class={styles.container}>
        <div class="dropdown">
          <label
            class={styles.label}
          >
            <div class={styles.preffixIcon}>
              <Icon icon="mdi:search" />
            </div>
            <input
              ref={inputRef}
              class={styles.input}
              v-model={inputValue.value}
              placeholder={searchPlaceholder.value}
              type="text"
              onKeyup={(e) => {
                if (e.key === 'Enter') {
                  handleEnter()
                }
              }}
            />
            <button
              class={styles.suffix}
              v-show={inputValue.value}
              onClick={handleClear}
            >
              <Icon
                class={styles.suffixIcon}
                icon="mdi:close"
              />
            </button>
          </label>
        </div>
      </div>
    )
  },
})

export default SearchBar
