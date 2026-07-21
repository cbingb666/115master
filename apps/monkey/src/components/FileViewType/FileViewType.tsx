import type { PropType } from 'vue'
import { useCycleList } from '@vueuse/core'
import { computed, defineComponent, watch } from 'vue'
import { Tooltip } from '@/components/Tooltip'
import { I, Icon } from '@/icons'

export type ViewType = 'list' | 'card'

const VIEW_TYPE_OPTIONS = [
  {
    name: '列表',
    value: 'list' as ViewType,
    icon: I.LIST,
  },
  {
    name: '卡片',
    value: 'card' as ViewType,
    icon: I.GRID,
  },
]
const VIEW_TYPE_VALUES = VIEW_TYPE_OPTIONS.map(option => option.value)

const FileViewType = defineComponent({
  name: 'FileViewType',
  props: {
    value: {
      type: String as PropType<ViewType>,
      default: 'list',
    },
    onUpdateValue: {
      type: Function as PropType<(viewType: ViewType) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    const cycle = useCycleList(VIEW_TYPE_VALUES, {
      initialValue: props.value,
    })

    watch(() => props.value, (value) => {
      cycle.state.value = value
    }, {
      immediate: true,
    })

    const currentOption = computed(() => {
      return VIEW_TYPE_OPTIONS.find(option => option.value === props.value) || VIEW_TYPE_OPTIONS[0]
    })

    const handleViewTypeChange = (viewType: ViewType) => {
      (document.activeElement as HTMLElement)?.blur()
      props.onUpdateValue(viewType)
    }

    const handleCycle = () => {
      handleViewTypeChange(cycle.next())
    }

    return () => (
      <Tooltip content={currentOption.value.name}>
        <button class="btn btn-glass rounded-full" onClick={handleCycle}>
          <Icon class="text-xl" name={currentOption.value.icon} />
        </button>
      </Tooltip>
    )
  },
})

export default FileViewType
