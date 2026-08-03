import type { PreferenceSection } from './PreferencesContent'
import { Dialog, Drawer, NavigationStack } from '@115master/ui'
import { useMediaQuery } from '@vueuse/core'
import { computed, defineComponent, ref } from 'vue'
import PreferencesContent, { PREFERENCE_SECTIONS } from './PreferencesContent'

const open = ref(false)
const section = ref<PreferenceSection | null>(null)

export function usePreferencesDialog() {
  return () => {
    section.value = null
    open.value = true
  }
}

function closePreferencesDialog() {
  open.value = false
}

export const PreferencesDialog = defineComponent({
  name: 'PreferencesDialog',

  setup() {
    const desktop = useMediaQuery('(min-width: 640px)')
    const title = computed(() => {
      if (desktop.value || section.value === null)
        return '偏好设置'
      return PREFERENCE_SECTIONS.find(item => item.id === section.value)?.label ?? '偏好设置'
    })
    const canGoBack = computed(() => !desktop.value && section.value !== null)
    const pageKey = computed(() => desktop.value ? 'desktop' : (section.value ?? 'root'))
    const depth = computed(() => !desktop.value && section.value !== null ? 1 : 0)

    function update(value: boolean) {
      open.value = value
    }

    function closed() {
      if (!open.value)
        section.value = null
    }

    const navigation = () => (
      <NavigationStack
        title={title.value}
        pageKey={pageKey.value}
        depth={depth.value}
        canGoBack={canGoBack.value}
        backLabel="返回偏好设置"
        closeLabel="关闭偏好设置"
        onBack={() => section.value = null}
        onDismiss={closePreferencesDialog}
      >
        <PreferencesContent
          section={section.value}
          onUpdate:section={value => section.value = value}
          onLoggedOut={closePreferencesDialog}
        />
      </NavigationStack>
    )

    return () => desktop.value
      ? (
          <Dialog
            open={open.value}
            label={title.value}
            size="lg"
            onUpdate:open={update}
            onClosed={closed}
          >
            {navigation}
          </Dialog>
        )
      : (
          <Drawer
            open={open.value}
            label={title.value}
            placement="bottom"
            size="lg"
            style="--ui-drawer-size: min(75dvh, 44rem)"
            onUpdate:open={update}
            onClosed={closed}
          >
            {navigation}
          </Drawer>
        )
  },
})
