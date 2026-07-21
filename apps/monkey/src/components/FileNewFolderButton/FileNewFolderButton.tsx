import type { PropType } from 'vue'
import { defineComponent } from 'vue'
import { Tooltip } from '@/components/Tooltip'
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
      <Tooltip content="新建">
        <button class="btn btn-glass rounded-full" onClick={handleClick}>
          <Icon class="text-xl" name={I.NEW_FOLDER} />
        </button>
      </Tooltip>
    )
  },
})

export default FileNewFolderButton
