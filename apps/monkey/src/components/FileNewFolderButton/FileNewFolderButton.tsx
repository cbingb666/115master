import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'

/**
 * 文件新建文件夹按钮
 */
const FileNewFolderButton = defineComponent({
  name: 'FileNewFolderButton',
  props: {
    /**
     * 点击事件
     */
    onClick: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  setup(props) {
    const handleClick = () => {
      props.onClick()
    }

    return () => (
      <button class="btn btn-ghost" onClick={handleClick}>
        <Icon class="text-xl" icon="material-symbols:create-new-folder-outline-rounded" />
        新建文件夹
      </button>
    )
  },
})

export default FileNewFolderButton
