import type { PropType } from 'vue'
import { defineComponent, useTemplateRef, watch } from 'vue'
import { useOfflineQuotaPackageInfoStore } from '@/store/offlineQuotaPackageInfo'

/** 云下载输入组件（链接输入 + 目录显示） */
export const CloudDownloadInput = defineComponent({
  props: {
    urlsValue: {
      type: String,
      required: true,
    },
    currentDirectory: {
      type: Object as PropType<{ name: string, path: string }>,
      required: true,
    },
    placeholder: {
      type: String,
      default: '',
    },
    onUrlsChange: {
      type: Function as PropType<(value: string) => void>,
      required: true,
    },
    onDirectorySelect: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const quotaStore = useOfflineQuotaPackageInfoStore()

    const textareaRef = useTemplateRef<HTMLTextAreaElement>('textareaRef')

    watch(textareaRef, () => {
      if (textareaRef.value) {
        setTimeout(() => {
          textareaRef.value?.focus()
        }, 100)
      }
    })

    return () => (
      <div class="flex flex-col gap-4">
        {/* 链接输入区域 */}
        <div>
          <textarea
            ref="textareaRef"
            class="resize-vertical font-inherit focus:border-primary w-full rounded-md border border-gray-200 p-3 text-sm leading-5 outline-none"
            autofocus
            placeholder={props.placeholder}
            rows={4}
            value={props.urlsValue}
            onInput={e => props.onUrlsChange((e.target as HTMLTextAreaElement).value)}
          />
        </div>

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

        {/* 保存目录显示和选择 */}
        <div>
          <label class="mb-2 block text-sm font-medium">
            保存到
          </label>
          <div class="flex items-center ">
            <div class="flex min-w-0 flex-1">
              <span class="mb-1 text-sm font-medium">
                {props.currentDirectory.name}
              </span>
              <span class="text-xs break-all text-gray-500">
                {props.currentDirectory.path}
              </span>
            </div>
            <button
              class="btn"
              type="button"
              onClick={props.onDirectorySelect}
            >
              选择目录
            </button>
          </div>
        </div>
      </div>
    )
  },
})
