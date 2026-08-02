import type { DialogHandle } from '@115master/ui'
import type { App, PropType } from 'vue'
import { Button, Dialog, Tooltip } from '@115master/ui'
import { LayoutGroup, motion, MotionConfig } from 'motion-v'
import {
  createApp,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { appDialog } from '@/app/dialog'
import { Image } from '@/components/Image'
import { I, Icon } from '@/icons'
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
const selectionSpring = {
  type: 'spring',
  visualDuration: 0.42,
  bounce: 0.28,
} as const
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
    tooltipTo: {
      type: Object as PropType<HTMLElement>,
      default: undefined,
    },
  },

  emits: {
    cancel: () => true,
    verified: () => true,
  },

  setup(props, { emit }) {
    const sign = ref('')
    const selected = ref<number[]>([])
    const flying = ref<number[]>([])
    const traveling = ref<number[]>([])
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
      flying.value = []
      traveling.value = []
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

      const values = [...selected.value, index]
      flying.value = values
      traveling.value = [...traveling.value, index]
      selected.value = values
      error.value = ''
    }

    function remove(order: number) {
      if (submitting.value)
        return
      const value = selected.value[order]
      const values = selected.value.filter((_, index) => index !== order)
      flying.value = values
      traveling.value = traveling.value.filter(index => index !== value)
      selected.value = values
      error.value = ''
    }

    function settle(index: number) {
      flying.value = flying.value.filter(value => value !== index)
      traveling.value = traveling.value.filter(value => value !== index)
    }

    function toggle(index: number) {
      const order = selected.value.indexOf(index)
      if (order < 0) {
        select(index)
        return
      }
      remove(order)
    }

    function removeAll() {
      if (!selected.value.length)
        return
      selected.value = []
      flying.value = []
      traveling.value = []
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
      <MotionConfig reducedMotion="user">
        <LayoutGroup id={`captcha-${challengeNonce.value}`}>
          <div class="flex flex-col pb-1 select-none" data-app-captcha-challenge>
            {sign.value
              ? (
                  <>
                    <div class="mx-auto w-full max-w-[480px]">
                      <Tooltip content="换一组" placement="top" to={props.tooltipTo}>
                        <button
                          type="button"
                          class="focus-visible:ring-primary/30 flex aspect-[72/23] w-full cursor-pointer items-center justify-center rounded-xl border-0 p-0 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-wait"
                          aria-label="换一组验证码"
                          data-captcha-prompt
                          disabled={loading.value || submitting.value}
                          onClick={() => void refresh()}
                        >
                          <Image
                            class="pointer-events-none size-full rounded-xl"
                            src={props.api.getCaptchaImage('prompt', undefined, challengeNonce.value)}
                            alt="验证码题目"
                            fit="contain"
                            draggable={false}
                          />
                        </button>
                      </Tooltip>
                    </div>
                    <div class="flex flex-col">
                      <div class="order-2 mx-auto mt-5 grid w-full max-w-[480px] grid-cols-5 gap-3" role="group" aria-label="验证码候选文字">
                        {candidates.map((index) => {
                          const chosen = selected.value.includes(index)
                          const travelingToSelection = traveling.value.includes(index)
                          return (
                            <button
                              key={index}
                              type="button"
                              class={[
                                'focus-visible:ring-primary/30 relative grid aspect-square place-items-center rounded-lg border p-0 transition-[background-color,border-color,opacity] focus-visible:ring-2 focus-visible:outline-none enabled:cursor-pointer disabled:cursor-not-allowed',
                                chosen
                                  ? 'border-base-content/10 bg-primary/30'
                                  : 'border-base-content/15 enabled:hover:border-base-content/30 bg-transparent',
                                selected.value.length >= 4 && !chosen && 'opacity-40',
                              ]}
                              disabled={
                                submitting.value
                                || (!chosen && selected.value.length >= 4)
                              }
                              title={`${chosen ? '撤回' : '选择'}候选文字 ${index + 1}`}
                              aria-label={`${chosen ? '撤回' : '选择'}候选文字 ${index + 1}`}
                              data-captcha-candidate={index}
                              onClick={() => toggle(index)}
                            >
                              {chosen && (
                                <div
                                  class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
                                  aria-hidden="true"
                                  data-captcha-chosen-image={index}
                                >
                                  <Image
                                    class="size-full"
                                    src={props.api.getCaptchaImage('single', index, challengeNonce.value)}
                                    alt=""
                                    fit="contain"
                                    draggable={false}
                                  />
                                  <span class="bg-primary/15 absolute inset-0" data-captcha-chosen-mask />
                                </div>
                              )}
                              <motion.div
                                class="relative z-10 size-full overflow-hidden"
                                layoutId={`character-${index}`}
                                transition={selectionSpring}
                                style={{
                                  borderRadius: 8,
                                  visibility: chosen && !travelingToSelection ? 'hidden' : undefined,
                                }}
                                data-captcha-motion-source={index}
                                data-captcha-layout-id={`character-${index}`}
                              >
                                <Image
                                  class="size-full"
                                  src={props.api.getCaptchaImage('single', index, challengeNonce.value)}
                                  alt=""
                                  fit="contain"
                                  draggable={false}
                                />
                              </motion.div>
                            </button>
                          )
                        })}
                      </div>
                      <div
                        class={[
                          'bg-base-content/5 relative order-1 mx-auto mt-5 flex h-20 w-full max-w-[480px] items-center justify-center gap-3 rounded-xl py-3 pl-3',
                          selected.value.length ? 'pr-16' : 'pr-3',
                        ]}
                        role="group"
                        aria-label="已选文字"
                        aria-live="polite"
                        data-captcha-selection
                      >
                        {!selected.value.length && (
                          <span
                            class="text-base-content/45 text-center text-sm leading-6"
                            data-captcha-placeholder
                          >
                            <span class="block">请观察图片提示，并按顺序点击上方对应文字。</span>
                            <span class="text-base-content/35 block" data-captcha-placeholder-hint>
                              点击上方图片，换一张
                            </span>
                          </span>
                        )}
                        {selected.value.map((index, order) => {
                          const moving = flying.value.includes(index)
                          return (
                            <div
                              key={index}
                              class={[
                                'group relative size-12 cursor-pointer rounded-lg border bg-transparent p-0 sm:size-14',
                                moving
                                  ? 'border-transparent'
                                  : 'border-base-content/15 hover:border-error/35 focus-within:border-error/35 transition-colors',
                              ]}
                              data-captcha-selected={order}
                              data-captcha-flying={moving ? 'true' : undefined}
                              onClick={() => remove(order)}
                            >
                              <motion.div
                                class={[
                                  'size-full overflow-hidden transition-opacity',
                                  !moving && 'group-focus-within:opacity-15 group-hover:opacity-15',
                                ]}
                                layoutId={`character-${index}`}
                                transition={selectionSpring}
                                style={{ borderRadius: 8 }}
                                onLayoutAnimationStart={() => {
                                  if (!flying.value.includes(index))
                                    flying.value = [...flying.value, index]
                                }}
                                onLayoutAnimationComplete={() => settle(index)}
                                data-captcha-motion-target={index}
                                data-captcha-layout-id={`character-${index}`}
                              >
                                <Image
                                  class="size-full"
                                  src={props.api.getCaptchaImage('single', index, challengeNonce.value)}
                                  alt={`已选择文字 ${order + 1}`}
                                  fit="contain"
                                  draggable={false}
                                />
                              </motion.div>
                              <Button
                                color="neutral"
                                size="sm"
                                shape="circle"
                                class={[
                                  'absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity',
                                  moving
                                    ? 'pointer-events-none'
                                    : 'group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100',
                                ]}
                                title={`删除已选择文字 ${order + 1}`}
                                aria-label={`删除已选择文字 ${order + 1}`}
                                tabindex={moving ? -1 : undefined}
                                data-captcha-selected-remove
                                onClick={(event) => {
                                  event.stopPropagation()
                                  remove(order)
                                }}
                              >
                                <Icon name={I.CLOSE} size="sm" />
                              </Button>
                            </div>
                          )
                        })}
                        {!!selected.value.length && (
                          <Button
                            variant="ghost"
                            size="md"
                            shape="square"
                            class="text-base-content/65 hover:text-error absolute right-3"
                            title="删除全部已选文字"
                            aria-label="删除全部已选文字"
                            data-captcha-remove-all
                            disabled={submitting.value}
                            onClick={removeAll}
                          >
                            <Icon name={I.BACKSPACE} size="md" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )
              : (
                  <div
                    class="relative mx-auto w-full max-w-[480px]"
                    aria-live="polite"
                    data-captcha-loading-layout
                  >
                    <div class="skeleton aspect-[72/23] w-full rounded-xl" data-captcha-loading-prompt />
                    <div class="skeleton mt-5 h-20 w-full rounded-xl" data-captcha-loading-selection />
                    <div class="mt-5 grid grid-cols-5 gap-3" data-captcha-loading-candidates>
                      {candidates.map(index => (
                        <div key={index} class="skeleton aspect-square rounded-lg" />
                      ))}
                    </div>
                    <div class="absolute inset-0 grid place-items-center">
                      <div class="bg-base-100/80 text-base-content/55 flex items-center gap-3 rounded-full px-4 py-2 text-sm backdrop-blur-sm">
                        {loading.value && <span class="loading loading-spinner loading-sm text-primary" aria-hidden="true" />}
                        <span>{loading.value ? '正在加载验证码…' : '验证码暂不可用'}</span>
                      </div>
                    </div>
                  </div>
                )}

            {error.value && (
              <p class="text-error mx-auto mt-5 w-full max-w-[480px] text-sm" role="alert">{error.value}</p>
            )}

            <div class="mx-auto mt-4 grid w-full max-w-[480px] grid-cols-2 gap-3">
              <Button
                color="neutral"
                disabled={submitting.value}
                onClick={() => emit('cancel')}
              >
                稍后
              </Button>
              <Button
                color="primary"
                loading={submitting.value}
                disabled={loading.value || !sign.value || selected.value.length !== 4}
                onClick={() => void submit()}
              >
                确认
              </Button>
            </div>
          </div>
        </LayoutGroup>
      </MotionConfig>
    )
  },
})

function masterDialog(api: CaptchaApi) {
  let verified = false
  const holder: { handle?: DialogHandle } = {}

  const handle = appDialog.create({
    title: '人机验证',
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
    size: 'md',
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
          title="人机验证"
          size="md"
          closeOnBackdrop={false}
          onClose={() => settle(false)}
        >
          {{
            default: () => (
              <CaptchaChallenge
                api={api}
                tooltipTo={root}
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
