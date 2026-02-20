import { h } from 'vue'
import PKG from '@/../package.json'
import { useDialog } from '@/components/Dialog'
import SponsorContent from './SponsorContent'

export function useSponsorDialog() {
  const dialog = useDialog()

  return () => {
    dialog.alert({
      content: () => h(SponsorContent),
      confirmText: '请我喝杯 Coffee',
      showCancel: true,
      cancelText: '狠心离开',
      maskClosable: true,
    }).then((confirmed) => {
      if (confirmed)
        window.open(PKG.funding, '_blank')
    })
  }
}
