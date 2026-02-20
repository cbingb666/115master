import { useStorage } from '@vueuse/core'
import { useSponsorDialog } from './useSponsorDialog'

const SHOWN_KEY = '115master_sponsor_shown'

export function useSponsorBoot() {
  const open = useSponsorDialog()
  const shown = useStorage(SHOWN_KEY, false)

  if (!shown.value) {
    shown.value = true
    open()
  }
}
