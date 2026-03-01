import type { FunctionalComponent, SlotsType } from 'vue'
import { defineComponent } from 'vue'

const MenuContentWrapper: FunctionalComponent<{ class?: string }> = (props, { slots }) => {
  return (
    <div
      class={[
        'flex',
        'gap-2',
        'text-md',
        props.class,
      ]}
      {...props}
    >
      {slots.default?.()}
    </div>
  )
}

/**
 * 文件菜单
 */
const FileMenu = defineComponent({
  name: 'FileMenu',
  slots: Object as SlotsType<{
    default: () => any
  }>,
  setup: (_, { slots }) => {
    return () => (
      <>
        <MenuContentWrapper>
          {slots.default?.()}
        </MenuContentWrapper>
      </>
    )
  },
})

export default FileMenu
