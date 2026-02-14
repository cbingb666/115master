import { createInjectionState } from '@vueuse/core'
import { shallowRef } from 'vue'

export const [useDriveLayoutProvide, useDriveLayoutStore] = createInjectionState(() => {
  const navbarHeight = shallowRef<number | null>(null)

  const setNavbarHeight = (height: number) => {
    navbarHeight.value = height
  }

  return {
    navbarHeight,
    setNavbarHeight,
  }
})

export function useDriveLayoutStoreOrThrow() {
  const driveLayoutStore = useDriveLayoutStore()
  if (driveLayoutStore == null)
    throw new Error('Please call `useDriveLayoutProvide` on the appropriate parent component')
  return driveLayoutStore
}
