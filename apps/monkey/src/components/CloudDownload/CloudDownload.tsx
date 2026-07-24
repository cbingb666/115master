import type { Share } from '@115master/drive115'
import type { PropType } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { computed, defineComponent, useTemplateRef, watch } from 'vue'
import FileItemThumbnail from '@/components/FileItem/FileItemThumbnail'
import { useOfflineQuotaPackageInfoStore } from '@/store/offlineQuotaPackageInfo'
import { actressFaceDB } from '@/utils/actressFaceDB'
import Button from '../Button/Button'

const CloudDownload = defineComponent({
  props: {
    inputValue: {
      type: String,
      required: true,
    },
    path: {
      type: Array as PropType<Partial<Share.Entity.PathItem>[]>,
      required: true,
    },
    onInput: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    onSelectDirectory: {
      type: Function as PropType<() => void>,
      required: true,
    },
    onSelectPath: {
      type: Function as PropType<(fileId: string, fileName: string, path?: Share.Entity.PathItem[]) => void>,
      required: true,
    },
  },
  setup(props) {
    const quotaStore = useOfflineQuotaPackageInfoStore()

    const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

    const pathParts = computed(() => {
      const [restPath, lastPath] = [props.path.slice(0, -1), props.path[props.path.length - 1]]
      return {
        restPath,
        lastPath,
      }
    })

    /** 异步获取女演员封面 */
    const actressAsyncState = useAsyncState(async () => {
      const last = pathParts.value.lastPath
      if (!last?.name) {
        return null
      }
      await actressFaceDB.init()
      const actress = await actressFaceDB.findActress(last.name.trim())
      return actress as { url: string } | null
    }, null, {
      immediate: true,
    })

    /** 监听路径变化，重新获取女演员封面 */
    watch(() => pathParts.value.lastPath?.name, () => {
      actressAsyncState.execute()
    })

    const thumbnailData = computed(() => {
      const last = pathParts.value.lastPath
      if (!last)
        return null

      /** 使用完整的文件夹信息，如果没有则使用基础信息 */
      const data = {
        n: last.name || '',
        cid: last.cid || '',
        fc: 0 as const,
        iv: 0,
      } as Share.Entity.FilesItem

      return {
        data,
        isFolder: true,
        isVideo: false,
        actressUrl: actressAsyncState.isReady.value && actressAsyncState.state.value?.url ? actressAsyncState.state.value.url : undefined,
        hasImagePreview: false,
      }
    })

    watch(textareaRef, () => {
      if (textareaRef.value) {
        setTimeout(() => {
          textareaRef.value?.focus()
        }, 100)
      }
    })

    return () => (
      <div class="flex flex-col gap-8">
        <div class="flex flex-col">
          {/* 链接输入区域 */}
          <div>
            <textarea
              ref="textareaRef"
              class="textarea textarea-md textarea-ghost bg-base-content/10 w-full"
              autofocus
              placeholder="支持HTTP、HTTPS、FTP、磁力链和电驴链接，换行可添加多个"
              rows={5}
              value={props.inputValue}
              onInput={e => props.onInput((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          {/* 配额信息 */}
          <div class="text-base-content/60 mt-2 flex items-center gap-2 text-sm">
            本月配额：剩
            {quotaStore.state?.surplus}
            /总
            {quotaStore.state?.count}
            个
            <a
              class="link link-primary"
              href="https://vip.115.com/?c=601"
              target="_blank"
            >
              购买配额
            </a>
          </div>
        </div>

        {/* 保存目录显示和选择 */}
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <label class="mb-2 block text-lg font-medium">
              保存到
            </label>
            <Button
              color="primary"
              variant="soft"
              size="sm"
              type="button"
              onClick={props.onSelectDirectory}
            >
              选择
            </Button>
          </div>

          {/* 当前选中的路径 */}
          <div class="bg-primary/10 rounded-xl px-3 py-2">
            <div class="flex items-center gap-3">
              <div class="size-14 shrink-0">
                {thumbnailData.value && (
                  <FileItemThumbnail
                    {...thumbnailData.value}
                  />
                )}
              </div>
              <div class="flex min-w-0 flex-1 flex-col">
                <span class="text-md font-medium">{pathParts.value?.lastPath?.name}</span>
                <span class="text-base-content/30 truncate text-sm">
                  {pathParts.value?.restPath?.map((p, i) => i === 0 ? [p.name] : [' / ', p.name])}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
})

export default CloudDownload
