import type { PreferenceSection } from './PreferencesContent'
import { NavigationStack } from '@115master/ui'
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
    const pageKey = computed(() => section.value ?? (desktop.value ? PREFERENCE_SECTIONS[0].id : 'root'))
    const depth = computed(() => !desktop.value && section.value !== null ? 1 : 0)

    function update(value: boolean) {
      open.value = value

      if (!value)
        section.value = null
    }

    return () => (
      <NavigationStack
        open={open.value}
        title={title.value}
        pageKey={pageKey.value}
        depth={depth.value}
        mobilePresentation="sheet"
        canGoBack={canGoBack.value}
        backLabel="返回偏好设置"
        closeLabel="关闭偏好设置"
        size="lg"
        class="app-preferences-dialog"
        onUpdate:open={update}
        onBack={() => section.value = null}
      >
        <PreferencesContent
          section={section.value}
          onUpdate:section={value => section.value = value}
        />
      </NavigationStack>
    )
  },
})
