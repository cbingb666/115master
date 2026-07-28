import { Button } from '@115master/ui'
import { defineComponent } from 'vue'
import { usePreferencesDialog } from '@/components/Preferences'
import { I, Icon } from '@/icons'

const SiderMenuButton = defineComponent({
  name: 'SiderMenuButton',
  setup() {
    const open = usePreferencesDialog()
    return () => (
      <Button
        variant="ghost"
        size="sm"
        shape="square"
        title="偏好设置"
        class="self-start"
        onClick={open}
      >
        <Icon name={I.SETTINGS} class="text-xl" />
      </Button>
    )
  },
})

export default SiderMenuButton
