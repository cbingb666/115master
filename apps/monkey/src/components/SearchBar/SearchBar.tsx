import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { useMagicKeys } from '@vueuse/core'
import { computed, defineComponent, shallowRef, useModel, watch } from 'vue'

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
        inputRef.value?.blur()
      }
    }

    /** 处理清除 */
    function handleClear() {
      inputValue.value = ''
    }

    return () => (
      <div
        class="
          group
          bg-base-content/10
          border-base-content/0
          focus-within:border-primary
          relative
          z-1000
          ml-4
          flex h-11
          flex-1
          flex-col
          justify-center
          rounded-full
          border
          sm:w-2xl
          sm:flex-none
        "
      >
        <div class="dropdown">
          <label class="relative z-1 flex w-full items-center gap-2 px-4 py-1.5">
            <div class="text-base-content text-2xl">
              <Icon icon="mdi:search" />
            </div>
            <input
              ref={inputRef}
              class="h-full w-full outline-none"
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
              class="flex-none opacity-50 group-focus-within:opacity-100"
              v-show={inputValue.value}
              onClick={handleClear}
            >
              <Icon
                class="text-base-content text-2xl"
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
