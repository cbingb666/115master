import { format } from '@115master/utils'
import { computed, defineComponent } from 'vue'
import LogoWordmark from '@/assets/logo-wordmark-inline.svg?component'
import { Menu } from '@/components/Menu'
import { useDriveAction } from '@/hooks/useDriveAction'
import { I, Icon } from '@/icons'
import { useDriveStore } from '@/store/driveList'
import { useDriveSpaceInfoStore } from '@/store/driveSpaceInfo'

const SiderContent = defineComponent({
  name: 'SiderContent',
  setup: () => {
    const action = useDriveAction()
    const store = useDriveStore()
    const spaceInfo = useDriveSpaceInfoStore()

    const percent = computed(() => {
      const allUse = spaceInfo?.state?.data?.space_info?.all_use?.size ?? 0
      const allTotal = spaceInfo?.state?.data?.space_info?.all_total?.size ?? 1
      return (allUse / allTotal * 100).toFixed(2)
    })

    async function cloudDownload(defaultUrls = '') {
      if (await action.cloudDownload(store.nav.cid, store.path, defaultUrls))
        store.afterAction()
    }

    return () => (
      <>
        <div class="flex items-center justify-center pt-7 pb-4">
          <LogoWordmark role="img" aria-label="115Master" class="text-base-content h-10 w-auto" />
        </div>
        <div class="bg-base-content/5 mb-3 h-px w-full" />
        <button
          class="btn btn-primary h-10"
          onClick={() => cloudDownload()}
        >
          <Icon class="text-xl" name={I.ADD_LINK} />
          离线下载
        </button>
        <div class="bg-base-content/5 my-3 h-px w-full" />
        <Menu class="flex-1" />
        <div class="bg-base-content/5 my-3 h-px w-full" />
        <div class="mt-2 flex flex-none flex-col gap-1.5" v-show={spaceInfo.state?.state === true}>
          <div class="text-base-content/60 flex items-baseline gap-1.5 text-xs">
            <span class="text-base-content/85 font-medium">
              {format.fileSize(spaceInfo?.state?.data?.space_info?.all_use?.size ?? 0)}
            </span>
            <span>/</span>
            <span>{format.fileSize(spaceInfo?.state?.data?.space_info?.all_total?.size ?? 0)}</span>
          </div>
          <progress class="progress progress-sm progress-primary w-38" max={100} value={percent.value} />
        </div>
        <div class="bg-base-content/5 my-3 h-px w-full" />
      </>
    )
  },
})

export default SiderContent
