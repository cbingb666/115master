import type { PropType } from 'vue'
import { Button } from '@115master/ui'
import { format } from '@115master/utils'
import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client'
import { computed, defineComponent, ref } from 'vue'
import { I, Icon } from '@/icons'
import { useUserAqStore } from '@/store/userAq'
import { drive115 } from '@/utils/drive115Instance'

type UploadStatus = 'idle' | 'uploading' | 'completed' | 'error'

const UploadTest = defineComponent({
  props: {
    cid: {
      type: String,
      required: true,
    },
    onClose: {
      type: Function as PropType<() => void>,
      required: true,
    },
  },
  setup(props) {
    const file = ref<File | null>(null)
    const status = ref<UploadStatus>('idle')
    const result = ref<Awaited<ReturnType<typeof drive115.upload.upload>> | null>(null)
    const appError = ref('')
    const logs = ref<string[]>([])

    const userAq = useUserAqStore()
    const uid = computed(() => String(userAq.state?.data?.uid ?? ''))
    const target = computed(() => `U_1_${props.cid}`)

    function log(msg: string) {
      logs.value.push(`[${new Date().toLocaleTimeString()}] ${msg}`)
    }

    function handleFile(e: Event) {
      const input = e.target as HTMLInputElement
      const f = input.files?.[0]
      if (f) {
        file.value = f
        status.value = 'idle'
        result.value = null
        appError.value = ''
        logs.value = []
        log(`已选择文件: ${f.name} (${format.fileSize(f.size)})`)
      }
    }

    async function startUpload() {
      if (!file.value || !uid.value)
        return

      status.value = 'uploading'
      appError.value = ''
      result.value = null

      const f = file.value
      log(`开始上传: ${f.name} (${format.fileSize(f.size)})`)
      log(`target: ${target.value}`)

      try {
        const info = await drive115.upload.initUpload({
          userid: uid.value,
          filename: f.name,
          filesize: f.size,
          target: target.value,
        })
        log(`凭证获取成功, host: ${new URL(info.host).hostname}`)

        const form = new FormData()
        form.append('key', info.object)
        form.append('policy', info.policy)
        form.append('OSSAccessKeyId', info.accessid)
        form.append('success_action_status', '200')
        form.append('callback', info.callback)
        form.append('signature', info.signature)
        form.append('file', f, f.name)

        const resp = await new Promise<string>((resolve, reject) => {
          GM_xmlhttpRequest({
            method: 'POST',
            url: info.host,
            data: form,
            timeout: 5 * 60 * 1000,
            onload: (r) => {
              if (r.status === 200)
                resolve(r.responseText)
              else reject(new Error(`OSS ${r.status}: ${r.responseText.substring(0, 300)}`))
            },
            onerror: e => reject(new Error(`请求失败: ${e.error}`)),
            ontimeout: () => reject(new Error('上传超时')),
          })
        })

        status.value = 'completed'
        log('上传成功!')
        log(`OSS 响应: ${resp.substring(0, 300)}`)
      }
      catch (e) {
        status.value = 'error'
        appError.value = e instanceof Error ? e.message : String(e)
        log(`上传失败: ${appError.value}`)
      }
    }

    return () => (
      <div class="flex flex-col gap-6">
        {/* 文件选择 */}
        <div class="flex flex-col gap-2">
          <label class="text-base-content/60 text-sm font-medium">选择文件</label>
          <div
            class={[
              'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
              file.value ? 'border-primary/50 bg-primary/5' : 'border-base-content/20 hover:border-base-content/40',
            ].join(' ')}
            onClick={() => (document.querySelector('.upload-test-file-input') as HTMLInputElement)?.click()}
          >
            {file.value
              ? (
                  <div class="flex flex-col gap-2">
                    <Icon name={I.UPLOAD} class="text-primary mx-auto text-3xl" />
                    <div class="font-medium">{file.value.name}</div>
                    <div class="text-base-content/60 text-sm">{format.fileSize(file.value.size)}</div>
                  </div>
                )
              : (
                  <div class="flex flex-col gap-2">
                    <Icon name={I.UPLOAD} class="text-base-content/50 mx-auto text-4xl" />
                    <div class="text-base-content/60">点击选择文件或拖拽到此处</div>
                  </div>
                )}
          </div>
          <input
            class="upload-test-file-input hidden"
            type="file"
            onChange={handleFile}
          />
        </div>

        {/* 进度条 */}
        {status.value === 'uploading' && (
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-sm">
              <span class="loading loading-spinner loading-sm" />
              <span class="text-base-content/60">上传中...</span>
            </div>
          </div>
        )}

        {/* 结果 */}
        {status.value === 'completed' && result.value && (
          <div class="bg-success/10 rounded-xl p-3 text-sm">
            <div class="text-success mb-1 font-medium">上传成功</div>
            <div>
              pick_code:
              <code class="text-xs">{result.value.data.pick_code}</code>
            </div>
            <div>
              sha1:
              <code class="text-xs">{result.value.data.sha1}</code>
            </div>
            <div>
              file_id:
              <code class="text-xs">{result.value.data.file_id}</code>
            </div>
          </div>
        )}

        {status.value === 'error' && appError.value && (
          <div class="bg-error/10 text-error rounded-xl p-3 text-sm">{appError.value}</div>
        )}

        {/* 操作按钮 */}
        <div class="flex gap-2">
          {(status.value === 'idle' || status.value === 'error') && file.value && (
            <Button color="primary" class="flex-1" onClick={startUpload} disabled={!uid.value}>
              <Icon name={I.UPLOAD} class="text-lg" />
              开始上传
            </Button>
          )}
          {status.value === 'completed' && (
            <Button
              variant="ghost"
              class="flex-1"
              onClick={() => {
                file.value = null
                status.value = 'idle'
                logs.value = []
                result.value = null
              }}
            >
              重新上传
            </Button>
          )}
        </div>

        {!uid.value && (
          <div class="text-error text-sm">未检测到登录状态，请刷新页面后重试</div>
        )}

        {/* 日志 */}
        {logs.value.length > 0 && (
          <div class="flex flex-col gap-1">
            <label class="text-base-content/60 text-sm font-medium">上传日志</label>
            <div class="bg-base-300/50 h-32 space-y-0.5 overflow-y-auto rounded-xl p-3 font-mono text-xs">
              {logs.value.map((l, i) => (
                <div key={i} class="text-base-content/60">{l}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  },
})

export default UploadTest
