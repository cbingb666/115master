import type { FunctionalComponent, SlotsType } from 'vue'
import { defineComponent } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  root: [
    'flex',
    'gap-2',
    'text-md',
  ],
})

const MenuContentWrapper: FunctionalComponent<{ class?: string }> = (props, { slots }) => {
  return (
    <div
      class={[styles.root, props.class]}
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
        {/* 桌面端菜单 */}
        <MenuContentWrapper>
          {slots.default?.()}
        </MenuContentWrapper>
      </>
    )
  },
})

export default FileMenu
