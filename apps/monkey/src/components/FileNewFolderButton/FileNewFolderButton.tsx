import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'

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
      <button class="btn btn-glass rounded-full" onClick={handleClick}>
        <Icon class="text-xl" name={I.NEW_FOLDER} />
        <span class="hidden sm:inline">新建</span>
      </button>
    )
  },
})

export default FileNewFolderButton
