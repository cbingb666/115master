import type { PreferenceSection } from './PreferencesContent'
import { NavigationSurface } from '@115master/ui'
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

    function update(value: boolean) {
      open.value = value

      if (!value)
        section.value = null
    }

    return () => (
      <NavigationSurface
        open={open.value}
        title={title.value}
        canGoBack={canGoBack.value}
        backLabel="返回偏好设置"
        closeLabel="关闭偏好设置"
        size="lg"
        onUpdate:open={update}
        onBack={() => section.value = null}
      >
        <PreferencesContent
          section={section.value}
          onUpdate:section={value => section.value = value}
        />
      </NavigationSurface>
    )
  },
})
