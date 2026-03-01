import type { PropType } from 'vue'
import { Icon } from '@iconify/vue'
import { defineComponent } from 'vue'

const FileNewFolderButton = defineComponent({
  name: 'FileNewFolderButton',
  props: {
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
      <button class="btn btn-sm btn-glass rounded-full" onClick={handleClick}>
        <Icon class="text-xl" icon="material-symbols:create-new-folder-outline-rounded" />
        <span class="hidden sm:inline">新建</span>
      </button>
    )
  },
})

export default FileNewFolderButton
