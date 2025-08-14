import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { computed, defineComponent } from 'vue'
import { ResponsiveMenu } from '..'

export type ViewType = 'list' | 'card'

const VIEW_TYPE_OPTIONS = [
  {
    name: '列表',
    value: 'list' as ViewType,
    icon: 'material-symbols:view-list',
  },
  {
    name: '卡片',
    value: 'card' as ViewType,
    icon: 'material-symbols:grid-view',
  },
]

/**
 * 文件视图类型选择器
 */
const FileViewType = defineComponent({
  name: 'FileViewType',
  props: {
    /**
     * 当前视图类型
     */
    value: {
      type: String as PropType<ViewType>,
      default: 'list',
    },
    /**
     * 视图类型改变事件
     */
    onUpdateValue: {
      type: Function as PropType<(viewType: ViewType) => void>,
      default: () => {},
    },
  },
  setup: (props) => {
    const currentOption = computed(() => {
      return VIEW_TYPE_OPTIONS.find(option => option.value === props.value) || VIEW_TYPE_OPTIONS[0]
    })

    const handleViewTypeChange = (viewType: ViewType) => {
      (document.activeElement as HTMLElement)?.blur()
      props.onUpdateValue(viewType)
    }

    return () => (
      <ResponsiveMenu title="请选择视图类型">
        {{
          target: (_props: object) => (
            <button
              class="btn btn-ghost"
              tabindex="0"
              {..._props}
            >
              <Icon class="text-2xl" icon={currentOption.value.icon} />
              <span class="hidden sm:inline">{currentOption.value.name}</span>
            </button>
          ),
          default: (_props: object) => (
            <ul {..._props}>
              {VIEW_TYPE_OPTIONS.map(option => (
                <li key={option.value} class="sm:w-32">
                  <a
                    class={{ 'bg-primary': props.value === option.value }}
                    tabindex="0"
                    onClick={() => handleViewTypeChange(option.value)}
                  >
                    <Icon class="text-xl" icon={option.icon} />
                    {option.name}
                  </a>
                </li>
              ))}
            </ul>
          ),
        }}
      </ResponsiveMenu>
    )
  },
})

export default FileViewType
