import { defineComponent } from 'vue'
import { usePreferencesDialog } from '@/components/Preferences'
import { I, Icon } from '@/icons'

const SiderMenuButton = defineComponent({
  name: 'SiderMenuButton',
  setup() {
    const open = usePreferencesDialog()
    return () => (
      <button
        type="button"
        title="偏好设置"
        class="text-base-content/50 hover:text-base-content flex cursor-pointer items-center justify-center self-start rounded-lg p-2 transition-colors"
        onClick={open}
      >
        <Icon name={I.SETTINGS} class="text-xl" />
      </button>
    )
  },
})

export default SiderMenuButton
