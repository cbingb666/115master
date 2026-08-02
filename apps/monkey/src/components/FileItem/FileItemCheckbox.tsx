import type { PropType } from 'vue'
import { defineComponent } from 'vue'

const FileItemCheckbox = defineComponent({
  name: 'FileItemCheckbox',
  props: {
    animate: {
      type: Boolean,
      required: true,
    },
    checked: {
      type: Boolean,
      required: true,
    },
    pathSelect: {
      type: Boolean,
      required: true,
    },
    selectMode: {
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
      if (document.querySelector('[role="dialog"][open], .alert')) {
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
      <label class={[
        `
          group-data-[view-type=card]:ui-z-cover
          group-data-[view-type=list]:ui-z-cover cursor-pointer
          group-data-[view-type=card]:absolute group-data-[view-type=card]:top-3
          group-data-[view-type=card]:left-3 group-data-[view-type=card]:flex
          group-data-[view-type=card]:items-center group-data-[view-type=list]:absolute
          group-data-[view-type=list]:top-1/2 group-data-[view-type=list]:left-0
          group-data-[view-type=list]:flex group-data-[view-type=list]:w-9
          group-data-[view-type=list]:-translate-y-1/2 group-data-[view-type=list]:items-center
        `,
        props.animate
          ? 'group-data-[view-type=list]:transition-transform group-data-[view-type=list]:duration-300 group-data-[view-type=list]:ease-[var(--ui-ease-move)] motion-reduce:group-data-[view-type=list]:transition-none'
          : '',
        props.selectMode
          ? 'group-data-[view-type=list]:translate-x-[var(--main-content-gutter)]'
          : 'pointer-events-none group-data-[view-type=list]:-translate-x-9',
      ]}
      >
        <input
          class={[
            `
              checkbox checkbox-sm
              checked:bg-primary checked:text-primary-content
              checked:border-primary
              group-data-[view-type=card]:transition-opacity group-data-[view-type=card]:duration-300
              group-data-[view-type=card]:ease-[var(--ui-ease-standard)]
              group-data-[view-type=list]:opacity-100
              motion-reduce:transition-none
            `,
            props.selectMode
              ? 'group-data-[view-type=card]:opacity-100'
              : 'group-data-[view-type=card]:opacity-0',
            !props.checked && `
              group-data-[view-type=card]:border-black/25
              group-data-[view-type=card]:bg-white/85
              group-data-[view-type=card]:shadow-sm
              group-data-[view-type=card]:backdrop-blur-sm
            `,
          ]}
          v-show={!props.pathSelect}
          checked={props.checked}
          tabindex={props.selectMode ? 0 : -1}
          type="checkbox"
          onInput={(e) => {
            props.onChecked?.((e.target as HTMLInputElement).checked)
          }}
          onKeydown={handleCheckboxKeyDown}
        />
        {/* 路径选择模式下的隐藏焦点元素 */}
        {/* {props.pathSelect && (
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
        )} */}
      </label>
    )
  },
})

export default FileItemCheckbox
