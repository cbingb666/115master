import type { PropType } from 'vue'
import { Button } from '@115master/ui'
import { defineComponent } from 'vue'
import { usePreferencesDialog } from '@/components/Preferences'
import { I, Icon } from '@/icons'

const SiderMenuButton = defineComponent({
  name: 'SiderMenuButton',
  props: {
    beforeOpen: {
      type: Function as PropType<() => void | Promise<void>>,
      default: undefined,
    },
  },
  setup(props) {
    const open = usePreferencesDialog()

    async function show() {
      await props.beforeOpen?.()
      open()
    }

    return () => (
      <Button
        variant="ghost"
        size="sm"
        shape="square"
        title="偏好设置"
        class="self-start"
        onClick={show}
      >
        <Icon name={I.SETTINGS} class="text-xl" />
      </Button>
    )
  },
})

export default SiderMenuButton
