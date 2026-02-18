import type { WebApi } from '@115master/drive115'
import type { PropType } from 'vue'
import { useAsyncState } from '@vueuse/core'
import { computed, defineComponent, useTemplateRef, watch } from 'vue'
import FileItemThumbnail from '@/components/FileItem/FileItemThumbnail'
import { useOfflineQuotaPackageInfoStore } from '@/store/offlineQuotaPackageInfo'
import { actressFaceDB } from '@/utils/actressFaceDB'
import { extractEmojis } from '@/utils/string'

const CloudDownload = defineComponent({
  props: {
    inputValue: {
      type: String,
      required: true,
    },
    path: {
      type: Array as PropType<Partial<WebApi.Entity.PathItem>[]>,
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
      type: Function as PropType<(fileId: string, fileName: string, path?: WebApi.Entity.PathItem[]) => void>,
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

    const emoji = computed(() => {
      const last = pathParts.value.lastPath
      if (last?.name) {
        return extractEmojis(last.name)[0]
      }
      return undefined
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
      } as WebApi.Entity.FilesItem

      return {
        data,
        isFolder: true,
        isVideo: false,
        emoji: emoji.value,
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
              class="resize-vertical font-inherit focus:border-primary w-full rounded-md border border-gray-200 p-3 text-sm leading-5 outline-none"
              autofocus
              placeholder="支持HTTP、HTTPS、FTP、磁力链和电驴链接，换行可添加多个"
              rows={4}
              value={props.inputValue}
              onInput={e => props.onInput((e.target as HTMLTextAreaElement).value)}
            />
          </div>

          {/* 配额信息 */}
          <div class="flex items-center gap-2 text-sm text-gray-500">
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
            <button
              class="btn btn-sm btn-primary btn-soft"
              type="button"
              onClick={props.onSelectDirectory}
            >
              选择
            </button>
          </div>

          {/* 当前选中的路径 */}
          <div class="bg-primary/10 border-primary/20 rounded-md border px-3 py-2">
            <div class="flex items-center gap-3">
              <div class="size-14 shrink-0">
                {thumbnailData.value && (
                  <FileItemThumbnail
                    {...thumbnailData.value}
                    draggable={false}
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
