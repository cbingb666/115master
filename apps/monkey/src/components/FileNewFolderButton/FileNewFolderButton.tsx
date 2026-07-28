import type { PropType } from 'vue'
import { Tooltip } from '@115master/ui'
import { defineComponent } from 'vue'
import { I, Icon } from '@/icons'
import Button from '../Button/Button'

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
        <Button variant="glass-floating" shape="circle" onClick={handleClick}>
          <Icon class="text-xl" name={I.NEW_FOLDER} />
        </Button>
      </Tooltip>
    )
  },
})

export default FileNewFolderButton
