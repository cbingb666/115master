import { h } from 'vue'
import PKG from '@/../package.json'
import { useAppDialog } from '@/app/dialog'
import SponsorContent from './SponsorContent'

export function useSponsorDialog() {
  const dialog = useAppDialog()

  return () => {
    void dialog.confirm({
      title: '支持 115Master',
      content: () => h(SponsorContent),
      confirmText: '请我喝杯 Coffee',
      cancelText: '狠心离开',
      closeOnBackdrop: true,
    }).then((confirmed) => {
      if (confirmed)
        window.open(PKG.funding, '_blank')
    }).catch(() => undefined)
  }
}
