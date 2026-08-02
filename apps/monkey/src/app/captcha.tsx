import type { DialogHandle } from '@115master/ui'
import type { App, PropType } from 'vue'
import { Button, Dialog } from '@115master/ui'
import {
  createApp,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { appDialog } from '@/app/dialog'
import mainStyles from '@/styles/main.css?inline'

interface CaptchaResult {
  state: boolean
  message: string
}

/** 911 安全验证所需的最小 API 能力。 */
export interface CaptchaApi {
  getCaptchaSign: (signal?: AbortSignal) => Promise<string>
  getCaptchaImage: (
    type: 'prompt' | 'single' | 'all',
    id?: number,
    nonce?: number,
  ) => string
  verifyCaptcha: (captcha: { code: string, sign: string }) => Promise<CaptchaResult>
}

const candidates = Array.from({ length: 10 }, (_, index) => index)
let active: Promise<boolean> | undefined
let lastNonce = 0

function nonce() {
  lastNonce = Math.max(lastNonce + 1, Date.now())
  return lastNonce
}

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback
}

const CaptchaChallenge = defineComponent({
  name: 'CaptchaChallenge',

  props: {
    api: {
      type: Object as PropType<CaptchaApi>,
      required: true,
    },
  },

  emits: {
    cancel: () => true,
    verified: () => true,
  },

  setup(props, { emit }) {
    const sign = ref('')
    const selected = ref<number[]>([])
    const challengeNonce = ref(nonce())
    const loading = ref(false)
    const submitting = ref(false)
    const error = ref('')
    let generation = 0
    let controller: AbortController | undefined
    let disposed = false

    async function refresh(notice = '') {
      const current = ++generation
      controller?.abort()
      controller = new AbortController()
      selected.value = []
      sign.value = ''
      error.value = notice
      loading.value = true
      challengeNonce.value = nonce()

      try {
        const value = await props.api.getCaptchaSign(controller.signal)
        if (!disposed && generation === current)
          sign.value = value
      }
      catch (cause) {
        if (
          disposed
          || generation !== current
          || (cause instanceof DOMException && cause.name === 'AbortError')
        ) {
          return
        }
        error.value = errorMessage(cause, '验证码加载失败，请重试')
      }
      finally {
        if (!disposed && generation === current)
          loading.value = false
      }
    }

    function select(index: number) {
      if (
        loading.value
        || submitting.value
        || !sign.value
        || selected.value.length >= 4
        || selected.value.includes(index)
      ) {
        return
      }

      selected.value = [...selected.value, index]
      error.value = ''
    }

    function removeLast() {
      if (submitting.value)
        return
      selected.value = selected.value.slice(0, -1)
      error.value = ''
    }

    async function submit() {
      if (!sign.value) {
        error.value = '请先加载验证码'
        return
      }
      if (selected.value.length !== 4) {
        error.value = '请按提示顺序选择 4 个文字'
        return
      }

      submitting.value = true
      error.value = ''
      try {
        const result = await props.api.verifyCaptcha({
          code: selected.value.join(''),
          sign: sign.value,
        })
        if (result.state) {
          emit('verified')
          return
        }

        await refresh(result.message || '验证未通过，请重新选择')
      }
      catch (cause) {
        error.value = errorMessage(cause, '验证提交失败，请重试')
      }
      finally {
        submitting.value = false
      }
    }

    onMounted(() => void refresh())
    onBeforeUnmount(() => {
      disposed = true
      generation += 1
      controller?.abort()
    })

    return () => (
      <div class="flex flex-col gap-4" data-app-captcha-challenge>
        <p class="text-base-content/65 text-sm">
          请观察图片提示，并按顺序点击下方对应文字。
        </p>

        {sign.value
          ? (
              <>
                <div class="border-base-content/10 bg-base-100 flex min-h-20 items-center justify-center rounded-xl border p-3">
                  <img
                    class="max-h-20 max-w-full"
                    src={props.api.getCaptchaImage('prompt', undefined, challengeNonce.value)}
                    alt="验证码题目"
                  />
                </div>
                <div class="grid grid-cols-5 gap-2" role="group" aria-label="验证码候选文字">
                  {candidates.map(index => (
                    <button
                      key={index}
                      type="button"
                      class="border-base-content/10 hover:border-primary hover:bg-primary/5 grid aspect-square place-items-center rounded-lg border bg-white p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={
                        submitting.value
                        || selected.value.length >= 4
                        || selected.value.includes(index)
                      }
                      title={`选择候选文字 ${index + 1}`}
                      aria-label={`选择候选文字 ${index + 1}`}
                      data-captcha-candidate={index}
                      onClick={() => select(index)}
                    >
                      <img
                        class="size-full object-contain"
                        src={props.api.getCaptchaImage('single', index, challengeNonce.value)}
                        alt=""
                      />
                    </button>
                  ))}
                </div>
                <div class="bg-base-content/5 flex min-h-14 items-center gap-2 rounded-xl p-2" aria-live="polite">
                  {selected.value.length
                    ? selected.value.map((index, order) => (
                        <div key={index} class="relative size-10 rounded-lg bg-white p-1">
                          <img
                            class="size-full object-contain"
                            src={props.api.getCaptchaImage('single', index, challengeNonce.value)}
                            alt={`已选择文字 ${order + 1}`}
                          />
                          <span class="bg-primary text-primary-content absolute -top-1 -right-1 grid size-4 place-items-center rounded-full text-[10px]">
                            {order + 1}
                          </span>
                        </div>
                      ))
                    : <span class="text-base-content/40 px-2 text-sm">尚未选择</span>}
                  <button
                    type="button"
                    class="text-base-content/55 hover:text-base-content ml-auto px-2 text-sm disabled:opacity-40"
                    disabled={!selected.value.length || submitting.value}
                    onClick={removeLast}
                  >
                    删除
                  </button>
                </div>
              </>
            )
          : (
              <div class="border-base-content/10 bg-base-100 text-base-content/55 flex min-h-44 items-center justify-center gap-3 rounded-xl border text-sm" aria-live="polite">
                {loading.value && <span class="loading loading-spinner loading-md text-primary" aria-hidden="true" />}
                <span>{loading.value ? '正在加载验证码…' : '验证码暂不可用'}</span>
              </div>
            )}

        {error.value && (
          <p class="text-error text-sm" role="alert">{error.value}</p>
        )}

        <div class="grid grid-cols-2 gap-3">
          <Button
            color="neutral"
            disabled={submitting.value}
            onClick={() => emit('cancel')}
          >
            稍后验证
          </Button>
          <Button
            color="primary"
            loading={submitting.value}
            disabled={loading.value || !sign.value || selected.value.length !== 4}
            onClick={() => void submit()}
          >
            确认验证
          </Button>
        </div>
        <button
          class="text-base-content/45 hover:text-base-content text-xs disabled:opacity-40"
          type="button"
          disabled={loading.value || submitting.value}
          onClick={() => void refresh()}
        >
          看不清，换一组
        </button>
      </div>
    )
  },
})

function masterDialog(api: CaptchaApi) {
  let verified = false
  const holder: { handle?: DialogHandle } = {}

  const handle = appDialog.create({
    title: '需要人机验证',
    content: () => (
      <CaptchaChallenge
        api={api}
        onCancel={() => holder.handle?.close()}
        onVerified={() => {
          verified = true
          holder.handle?.close()
        }}
      />
    ),
    showConfirm: false,
    showCancel: false,
    confirmOnEnter: false,
    closeOnBackdrop: false,
    history: true,
  })
  holder.handle = handle

  return handle.closed.then(() => verified)
}

function standaloneTheme() {
  const value = document.documentElement.getAttribute('data-theme')
  if (value === 'light' || value === 'dark')
    return value
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function standaloneDialog(api: CaptchaApi) {
  return new Promise<boolean>((resolve) => {
    const host = document.createElement('div')
    host.dataset.appCaptcha = 'host'
    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    const root = document.createElement('div')
    style.textContent = mainStyles
    root.dataset.theme = standaloneTheme()
    shadow.append(style, root)
    document.body.append(host)

    let app: App<Element> | undefined
    let settled = false

    const settle = (value: boolean) => {
      if (settled)
        return
      settled = true
      resolve(value)
      queueMicrotask(() => {
        app?.unmount()
        host.remove()
      })
    }

    const StandaloneCaptcha = defineComponent({
      name: 'StandaloneCaptcha',
      setup: () => () => (
        <Dialog
          open
          title="需要人机验证"
          size="md"
          closeOnBackdrop={false}
          onClose={() => settle(false)}
        >
          {{
            default: () => (
              <CaptchaChallenge
                api={api}
                onCancel={() => settle(false)}
                onVerified={() => settle(true)}
              />
            ),
          }}
        </Dialog>
      ),
    })

    app = createApp(StandaloneCaptcha)
    app.mount(root)
  })
}

/** 打开原生四字点选人机验证；同一时间只保留一个验证任务。 */
export function showCaptcha(api: CaptchaApi) {
  if (active)
    return active

  const pending = document.getElementById('my-app')
    ? masterDialog(api)
    : standaloneDialog(api)
  const settled = pending.finally(() => {
    if (active === settled)
      active = undefined
  })

  active = settled
  return settled
}
