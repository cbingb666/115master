import type { PropType } from 'vue'
import { defineComponent } from 'vue'

const FileListItemCheckbox = defineComponent({
  name: 'FileListItemCheckbox',
  props: {
    checked: {
      type: Boolean,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      required: true,
    },
    onChecked: {
      type: Function as PropType<(checked: boolean) => void>,
      default: () => {},
    },
    onEnter: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  setup(props) {
    function handleCheckboxKeyDown(e: KeyboardEvent) {
      // 如果页面有打开的对话框，则不处理键盘事件
      if (document.querySelector('[role="dialog"], .modal, .alert')) {
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        props.onEnter?.()
      }
      // 允许空格键切换选中状态（checkbox的默认行为）
      else if (e.key === ' ') {
        e.preventDefault()
        props.onChecked?.(!props.checked)
      }
    }

    return () => (
      <label class="
        cursor-pointer
        group-data-[view-type=card]:absolute group-data-[view-type=card]:top-3
        group-data-[view-type=card]:left-3 group-data-[view-type=card]:z-10
        group-data-[view-type=card]:flex group-data-[view-type=card]:items-center
        group-data-[view-type=list]:flex group-data-[view-type=list]:cursor-pointer
        group-data-[view-type=list]:items-center group-data-[view-type=list]:px-4
      "
      >
        <input
          class="
            checkbox checkbox-sm
            checked:bg-primary opacity-0
            transition-all group-hover:opacity-100
            checked:opacity-100
          "
          v-show={!props.pathSelect}
          checked={props.checked}
          tabindex="0"
          type="checkbox"
          onInput={(e) => {
            props.onChecked?.((e.target as HTMLInputElement).checked)
          }}
          onKeydown={handleCheckboxKeyDown}
        />
        {/* 路径选择模式下的隐藏焦点元素 */}
        {props.pathSelect && (
          <input
            style={{
              position: 'absolute',
              opacity: 0,
              pointerEvents: 'none',
              width: '1px',
              height: '1px',
            }}
            tabindex="0"
            type="checkbox"
            onKeydown={handleCheckboxKeyDown}
          />
        )}
      </label>
    )
  },
})

export default FileListItemCheckbox
