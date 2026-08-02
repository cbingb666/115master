import type { Api } from '@115master/drive115'
import { Button } from '@115master/ui'
import { useTitle } from '@vueuse/core'
import { computed, defineComponent, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEFAULT_LOGIN_REASON, resolveLoginRedirect } from '@/app/login'
import logo from '@/assets/logo.svg?url'
import { drive115 } from '@/utils/drive115Instance'

type Outcome = Api.AuthApi.Res.LoginOutcome
type Captcha = Api.AuthApi.Req.Captcha
type Mode = 'qrcode' | 'account'
type Step
  = | 'main'
    | 'captcha'
    | 'sms'
    | 'two-factor'
    | 'bind-mobile'
    | 'cancel-close'
    | 'recovery'
    | 'success'
type CaptchaTarget = 'login' | 'sms' | 'two-factor'

function aborted(signal: AbortSignal) {
  return signal.aborted
}

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(signal.reason)
    }, { once: true })
  })
}

function writeCookies(values?: Record<string, string>) {
  Object.entries(values ?? {}).forEach(([name, value]) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; domain=.115.com; Secure; SameSite=Lax`
  })
}

const LoginPage = defineComponent({
  name: 'LoginPage',

  setup() {
    useTitle('登录 · 115Master')

    const route = useRoute()
    const router = useRouter()
    const mode = ref<Mode>('qrcode')
    const step = ref<Step>('main')
    const account = ref('')
    const password = ref('')
    const remember = ref(true)
    const busy = ref(false)
    const error = ref('')
    const notice = ref('')
    const challenge = shallowRef<Outcome>()
    const qrcode = shallowRef<Api.AuthApi.Res.QrcodeToken>()
    const qrState = ref('正在获取二维码…')
    const qrLoading = ref(false)
    const captchaTarget = ref<CaptchaTarget>('login')
    const captchaSign = ref('')
    const captchaNonce = ref(0)
    const selected = ref<number[]>([])
    const loginCaptcha = shallowRef<Captcha>()
    const smsCode = ref('')
    const cooldown = ref(0)
    const bindUrl = ref('')
    let controller: AbortController | undefined
    let countdown: ReturnType<typeof setInterval> | undefined
    let reload: ReturnType<typeof setTimeout> | undefined
    let callback = ''

    const reason = computed(() => {
      const value = Array.isArray(route.query.reason) ? route.query.reason[0] : route.query.reason
      return value || DEFAULT_LOGIN_REASON
    })

    const title = computed(() => {
      switch (step.value) {
        case 'captcha':
          return '安全验证码'
        case 'sms':
          return '短信验证'
        case 'two-factor':
          return '异常登录验证'
        case 'bind-mobile':
          return '绑定手机'
        case 'cancel-close':
          return '账号注销确认'
        case 'recovery':
          return '账号安全提醒'
        case 'success':
          return '登录成功'
        default:
          return '登录 115'
      }
    })

    const recoveryUrl = computed(() => {
      if (challenge.value?.kind === 'locked')
        return 'https://aq.115.com/?action=forgot'
      const url = new URL('/appeal', 'https://aq.115.com')
      url.searchParams.set('reason', '4')
      url.searchParams.set('account', account.value.trim())
      return url.href
    })

    function stopQrcode() {
      controller?.abort()
      controller = undefined
      qrLoading.value = false
    }

    function stopCountdown() {
      if (countdown)
        clearInterval(countdown)
      countdown = undefined
      cooldown.value = 0
    }

    function clearCallback() {
      if (!callback)
        return
      delete (window as unknown as Record<string, unknown>)[callback]
      callback = ''
      bindUrl.value = ''
    }

    function startCooldown() {
      stopCountdown()
      cooldown.value = 60
      countdown = setInterval(() => {
        cooldown.value -= 1
        if (cooldown.value > 0)
          return
        stopCountdown()
      }, 1000)
    }

    async function finish(outcome: Extract<Outcome, { kind: 'success' }>) {
      writeCookies(outcome.cookies)
      password.value = ''
      stopQrcode()
      stopCountdown()
      step.value = 'success'
      notice.value = outcome.message || '认证完成，正在重新加载 MasterApp…'
      reload = setTimeout(() => {
        void router.replace(resolveLoginRedirect(route.query.redirect))
          .finally(() => window.location.reload())
      }, 600)
    }

    async function openCaptcha(target: CaptchaTarget, outcome = challenge.value) {
      stopQrcode()
      captchaTarget.value = target
      challenge.value = outcome
      step.value = 'captcha'
      error.value = ''
      notice.value = ''
      selected.value = []
      captchaSign.value = ''
      captchaNonce.value = Date.now()
      busy.value = true
      try {
        captchaSign.value = await drive115.auth.getCaptchaSign()
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '验证码加载失败'
      }
      finally {
        busy.value = false
      }
    }

    function openBinding(outcome: Extract<Outcome, { kind: 'bind-mobile' }>) {
      clearCallback()
      challenge.value = outcome
      step.value = 'bind-mobile'
      callback = `masterLoginBind_${Date.now().toString(36)}`
      const url = new URL('/index/no_bind_mobile_index', 'https://aq.115.com')
      url.searchParams.set('callback', callback)
      if (outcome.token)
        url.searchParams.set('token', outcome.token)
      bindUrl.value = url.href
      ;(window as unknown as Record<string, unknown>)[callback] = (success: unknown) => {
        if (success)
          void submitLogin(true)
      }
    }

    async function handle(outcome: Outcome, origin = step.value) {
      challenge.value = outcome
      error.value = ''
      notice.value = ''

      switch (outcome.kind) {
        case 'success':
          await finish(outcome)
          return
        case 'captcha':
          await openCaptcha('login', outcome)
          return
        case 'sms':
          step.value = 'sms'
          return
        case 'two-factor':
          step.value = 'two-factor'
          return
        case 'bind-mobile':
          openBinding(outcome)
          return
        case 'cancel-close':
          step.value = 'cancel-close'
          return
        case 'locked':
        case 'appeal':
          step.value = 'recovery'
          return
        case 'error':
          if (outcome.field === 'code' && loginCaptcha.value) {
            await openCaptcha('login', outcome)
            error.value = outcome.message || '验证码错误，请重新输入'
            return
          }
          if (origin === 'sms' || origin === 'two-factor' || origin === 'cancel-close') {
            step.value = origin
            error.value = outcome.message || '验证失败，请重试'
            return
          }
          step.value = 'main'
          error.value = outcome.message || '登录失败，请检查账号和密码'
      }
    }

    async function submitLogin(retry = false, sms = '') {
      if (!account.value.trim() || !password.value) {
        error.value = '请输入 115 账号和密码'
        return
      }
      if (!retry)
        loginCaptcha.value = undefined
      busy.value = true
      error.value = ''
      notice.value = ''
      const origin = step.value
      try {
        await handle(await drive115.auth.login({
          account: account.value.trim(),
          password: password.value,
          remember: remember.value,
          goto: window.location.href,
          captcha: loginCaptcha.value,
          smsCode: sms || undefined,
        }), origin)
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '登录请求失败'
      }
      finally {
        busy.value = false
      }
    }

    async function submitCaptcha() {
      if (!captchaSign.value || !selected.value.length) {
        error.value = '请按图片提示依次选择下方文字'
        return
      }
      const captcha = {
        code: selected.value.join(''),
        sign: captchaSign.value,
      }
      if (captchaTarget.value === 'login') {
        loginCaptcha.value = captcha
        await submitLogin(true)
        return
      }
      await sendSms(captcha)
    }

    async function sendSms(captcha?: Captcha) {
      const outcome = challenge.value
      if (!outcome?.userId || (outcome.kind !== 'sms' && outcome.kind !== 'two-factor')) {
        error.value = '登录响应缺少用户信息，请返回后重新登录'
        return
      }
      busy.value = true
      error.value = ''
      try {
        const result = await drive115.auth.sendSms({
          userId: outcome.userId,
          template: outcome.kind === 'two-factor' ? 'login_from_two_step' : 'verify_code',
          captcha,
        })
        if (result.state) {
          step.value = outcome.kind
          notice.value = '验证码已发送，请留意手机短信'
          startCooldown()
          return
        }
        if (drive115.auth.isSmsCaptchaRequired(result)) {
          await openCaptcha(outcome.kind, outcome)
          return
        }
        error.value = result.message || '短信验证码发送失败'
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '短信验证码发送失败'
      }
      finally {
        busy.value = false
      }
    }

    async function submitSms() {
      const outcome = challenge.value
      if (!smsCode.value.trim()) {
        error.value = '请输入短信验证码'
        return
      }
      if (outcome?.kind === 'sms') {
        await submitLogin(true, smsCode.value.trim())
        return
      }
      if (outcome?.kind !== 'two-factor' || !outcome.userId) {
        error.value = '登录响应缺少验证信息，请返回后重新登录'
        return
      }
      busy.value = true
      error.value = ''
      try {
        await handle(await drive115.auth.verify({
          userId: outcome.userId,
          code: smsCode.value.trim(),
          codeId: outcome.codeId ?? outcome.token ?? outcome.sign,
          ssoMode: outcome.ssoMode,
        }), 'two-factor')
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '异常验证失败'
      }
      finally {
        busy.value = false
      }
    }

    async function cancelClose() {
      if (!challenge.value?.closeToken) {
        error.value = '登录响应缺少注销凭证，请返回后重新登录'
        return
      }
      busy.value = true
      error.value = ''
      try {
        await handle(await drive115.auth.cancelClose(challenge.value.closeToken), 'cancel-close')
      }
      catch (cause) {
        error.value = cause instanceof Error ? cause.message : '撤销注销失败'
      }
      finally {
        busy.value = false
      }
    }

    async function startQrcode() {
      stopQrcode()
      const current = new AbortController()
      controller = current
      qrcode.value = undefined
      qrState.value = '正在获取二维码…'
      qrLoading.value = true
      error.value = ''

      try {
        const token = await drive115.auth.getQrcodeToken(current.signal)
        if (aborted(current.signal))
          return
        qrcode.value = token
        qrState.value = '使用 115 App 或微信扫码登录'
        qrLoading.value = false

        while (!aborted(current.signal) && mode.value === 'qrcode' && step.value === 'main') {
          const result = await drive115.auth.getQrcodeStatus(token, current.signal)
          if (aborted(current.signal))
            return
          if (result.status === 0) {
            qrState.value = '等待扫码…'
          }
          else if (result.status === 1) {
            qrState.value = '扫描成功，请在手机上确认'
          }
          else if (result.status === 2) {
            qrState.value = '正在完成登录…'
            await handle(await drive115.auth.loginQrcode(token.uid))
            return
          }
          else {
            qrState.value = result.message || '二维码已失效，请刷新'
            return
          }
          await pause(500, current.signal)
        }
      }
      catch (cause) {
        if (!aborted(current.signal))
          error.value = cause instanceof Error ? cause.message : '二维码加载失败'
      }
      finally {
        if (controller === current) {
          controller = undefined
          qrLoading.value = false
        }
      }
    }

    function selectMode(value: Mode) {
      if (mode.value === value)
        return
      stopQrcode()
      step.value = 'main'
      mode.value = value
      error.value = ''
      notice.value = ''
      if (value === 'qrcode')
        void startQrcode()
    }

    function back() {
      stopCountdown()
      clearCallback()
      step.value = 'main'
      challenge.value = undefined
      smsCode.value = ''
      error.value = ''
      notice.value = ''
      if (mode.value === 'qrcode')
        void startQrcode()
    }

    function backFromCaptcha() {
      if (captchaTarget.value === 'login') {
        stopQrcode()
        step.value = 'main'
        mode.value = 'account'
        challenge.value = undefined
        error.value = ''
        notice.value = ''
        return
      }
      step.value = captchaTarget.value
      error.value = ''
    }

    onMounted(() => void startQrcode())

    onBeforeUnmount(() => {
      stopQrcode()
      stopCountdown()
      clearCallback()
      if (reload)
        clearTimeout(reload)
    })

    function Alert() {
      if (!error.value && !notice.value)
        return null
      return (
        <div
          class={[
            'rounded-lg px-3 py-2 text-sm',
            error.value ? 'bg-error/10 text-error' : 'bg-success/10 text-success',
          ]}
          role={error.value ? 'alert' : 'status'}
        >
          {error.value || notice.value}
        </div>
      )
    }

    function Main() {
      return (
        <div class="flex flex-col gap-5">
          <div class="bg-base-content/5 grid grid-cols-2 rounded-xl p-1">
            {([
              ['qrcode', '扫码登录'],
              ['account', '账号登录'],
            ] as const).map(item => (
              <button
                key={item[0]}
                type="button"
                class={[
                  'rounded-lg px-3 py-2 text-sm transition-colors ease-[var(--ui-ease-standard)]',
                  mode.value === item[0]
                    ? 'bg-base-100 text-base-content shadow-sm'
                    : 'text-base-content/55 hover:text-base-content',
                ]}
                onClick={() => selectMode(item[0])}
              >
                {item[1]}
              </button>
            ))}
          </div>

          {mode.value === 'qrcode'
            ? (
                <div class="flex min-h-72 flex-col items-center justify-center gap-4">
                  <div class="border-base-content/10 grid size-52 place-items-center overflow-hidden rounded-2xl border bg-white p-3">
                    {qrcode.value
                      ? (
                          <img
                            class="size-full"
                            src={drive115.auth.getQrcodeImage(qrcode.value.uid, captchaNonce.value)}
                            alt="115 登录二维码"
                          />
                        )
                      : <span class="loading loading-spinner loading-lg text-primary" />}
                  </div>
                  <p class="text-base-content/65 text-center text-sm">{qrState.value}</p>
                  <Button
                    color="primary"
                    variant="soft"
                    size="sm"
                    loading={qrLoading.value}
                    onClick={() => startQrcode()}
                  >
                    刷新二维码
                  </Button>
                </div>
              )
            : (
                <form
                  class="flex flex-col gap-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void submitLogin()
                  }}
                >
                  <label class="form-control gap-1.5">
                    <span class="text-base-content/70 text-sm">账号</span>
                    <input
                      class="input input-bordered h-11 w-full"
                      name="username"
                      autocomplete="username"
                      placeholder="115 账号或手机号"
                      value={account.value}
                      onInput={event => account.value = (event.target as HTMLInputElement).value}
                    />
                  </label>
                  <label class="form-control gap-1.5">
                    <span class="text-base-content/70 text-sm">密码</span>
                    <input
                      class="input input-bordered h-11 w-full"
                      name="password"
                      type="password"
                      autocomplete="current-password"
                      placeholder="登录密码"
                      value={password.value}
                      onInput={event => password.value = (event.target as HTMLInputElement).value}
                    />
                  </label>
                  <label class="text-base-content/65 flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      class="checkbox checkbox-primary checkbox-sm"
                      type="checkbox"
                      checked={remember.value}
                      onChange={event => remember.value = (event.target as HTMLInputElement).checked}
                    />
                    保持登录状态
                  </label>
                  <Alert />
                  <Button block color="primary" type="submit" loading={busy.value}>登录</Button>
                  <div class="text-base-content/50 flex justify-center gap-3 text-xs">
                    <a class="link-hover" href="https://aq.115.com/?action=forgot" target="_blank">忘记密码</a>
                    <span>·</span>
                    <a class="link-hover" href="https://115.com/#register=1" target="_blank">注册账号</a>
                  </div>
                </form>
              )}
          {mode.value === 'qrcode' && <Alert />}
        </div>
      )
    }

    function CaptchaView() {
      const images = Array.from({ length: 10 }, (_, index) => index)
      return (
        <div class="flex flex-col gap-4">
          <p class="text-base-content/65 text-sm">请观察图片提示，并按顺序点击下方对应文字。</p>
          <div class="border-base-content/10 bg-base-100 flex min-h-20 items-center justify-center rounded-xl border p-3">
            <img
              class="max-h-20 max-w-full"
              src={drive115.auth.getCaptchaImage('prompt', undefined, captchaNonce.value)}
              alt="验证码题目"
            />
          </div>
          <div class="grid grid-cols-5 gap-2">
            {images.map(index => (
              <button
                key={index}
                type="button"
                class="border-base-content/10 hover:border-primary hover:bg-primary/5 grid aspect-square place-items-center rounded-lg border bg-white p-1 transition-colors"
                disabled={selected.value.length >= 4}
                title={`选择候选文字 ${index + 1}`}
                onClick={() => selected.value = [...selected.value, index]}
              >
                <img
                  class="size-full object-contain"
                  src={drive115.auth.getCaptchaImage('single', index, captchaNonce.value)}
                  alt={`候选文字 ${index + 1}`}
                />
              </button>
            ))}
          </div>
          <div class="bg-base-content/5 flex min-h-14 items-center gap-2 rounded-xl p-2">
            {selected.value.length
              ? selected.value.map((index, order) => (
                  <div key={`${order}-${index}`} class="relative size-10 rounded-lg bg-white p-1">
                    <img
                      class="size-full object-contain"
                      src={drive115.auth.getCaptchaImage('single', index, captchaNonce.value)}
                      alt={`已选择文字 ${order + 1}`}
                    />
                    <span class="bg-primary text-primary-content absolute -top-1 -right-1 grid size-4 place-items-center rounded-full text-[10px]">{order + 1}</span>
                  </div>
                ))
              : <span class="text-base-content/40 px-2 text-sm">尚未选择</span>}
            <button
              type="button"
              class="text-base-content/55 hover:text-base-content ml-auto px-2 text-sm"
              disabled={!selected.value.length}
              onClick={() => selected.value = selected.value.slice(0, -1)}
            >
              删除
            </button>
          </div>
          <Alert />
          <div class="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={backFromCaptcha}>返回</Button>
            <Button color="primary" loading={busy.value} onClick={() => submitCaptcha()}>确认验证</Button>
          </div>
          <button class="text-base-content/45 hover:text-base-content text-xs" type="button" onClick={() => openCaptcha(captchaTarget.value)}>
            看不清，换一组
          </button>
        </div>
      )
    }

    function SmsView() {
      const mobile = challenge.value?.mobile || '绑定手机'
      return (
        <form
          class="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            void submitSms()
          }}
        >
          <div class="bg-info/10 text-info rounded-xl p-3 text-sm">
            {challenge.value?.message || `请使用 ${mobile} 接收短信验证码。`}
          </div>
          <label class="form-control gap-1.5">
            <span class="text-base-content/70 text-sm">短信验证码</span>
            <div class="flex gap-2">
              <input
                class="input input-bordered h-11 min-w-0 flex-1"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength={8}
                placeholder="输入验证码"
                value={smsCode.value}
                onInput={event => smsCode.value = (event.target as HTMLInputElement).value}
              />
              <Button
                variant="soft"
                color="primary"
                disabled={cooldown.value > 0}
                loading={busy.value}
                onClick={() => sendSms()}
              >
                {cooldown.value > 0 ? `${cooldown.value} 秒` : '获取验证码'}
              </Button>
            </div>
          </label>
          <Alert />
          <div class="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={back}>重新登录</Button>
            <Button color="primary" type="submit" loading={busy.value}>确认</Button>
          </div>
        </form>
      )
    }

    function BindMobile() {
      return (
        <div class="flex flex-col gap-4">
          <p class="text-base-content/65 text-sm">为保障账号安全，需要先完成手机绑定。绑定完成后会自动继续登录。</p>
          {bindUrl.value && (
            <iframe
              class="border-base-content/10 h-80 w-full rounded-xl border bg-white"
              src={bindUrl.value}
              title="绑定 115 手机"
            />
          )}
          <Alert />
          <div class="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={back}>返回</Button>
            <Button color="primary" loading={busy.value} onClick={() => submitLogin(true)}>已完成绑定</Button>
          </div>
          <a class="link link-primary text-center text-xs" href={bindUrl.value} target="_blank">在新窗口中完成绑定</a>
        </div>
      )
    }

    function CancelClose() {
      return (
        <div class="flex flex-col gap-5">
          <div class="bg-warning/10 text-warning rounded-xl p-4 text-sm">
            {challenge.value?.message || '该账号正在注销流程中，需要先撤销注销申请才能继续登录。'}
          </div>
          <Alert />
          <div class="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={back}>返回</Button>
            <Button color="warning" loading={busy.value} onClick={() => cancelClose()}>撤销注销并登录</Button>
          </div>
        </div>
      )
    }

    function Recovery() {
      return (
        <div class="flex flex-col gap-5">
          <div class="bg-error/10 text-error rounded-xl p-4 text-sm">
            {challenge.value?.message || '账号当前无法登录，请完成安全处理后重试。'}
          </div>
          <div class="grid grid-cols-2 gap-3">
            <Button variant="soft" onClick={back}>返回</Button>
            <a class="btn btn-primary" href={recoveryUrl.value} target="_blank">
              {challenge.value?.kind === 'locked' ? '重置密码' : '账号申诉'}
            </a>
          </div>
        </div>
      )
    }

    function Success() {
      return (
        <div class="flex flex-col items-center gap-4 py-8 text-center">
          <div class="bg-success/15 text-success grid size-16 place-items-center rounded-full text-3xl">✓</div>
          <p class="text-base-content font-medium">认证已完成</p>
          <p class="text-base-content/60 text-sm">{notice.value}</p>
          <span class="loading loading-spinner loading-md text-primary" />
        </div>
      )
    }

    return () => (
      <div class="bg-base-200 text-base-content flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6">
        <main
          class="ui-glass-floating border-base-content/10 w-full max-w-lg rounded-3xl border p-5 shadow-xl sm:p-7"
          data-login-page
        >
          <div class="mb-5 flex items-center gap-3">
            <img class="size-11 rounded-xl" src={logo} alt="" />
            <div>
              <p class="text-base-content font-semibold">115Master</p>
              <p class="text-base-content/45 text-xs">凭据只用于本次 115 官方登录请求</p>
            </div>
          </div>
          <div class="mb-5">
            <h1 class="text-lg font-semibold" data-title>{title.value}</h1>
            {step.value === 'main' && (
              <p class="text-base-content/60 mt-1 text-sm">{reason.value}</p>
            )}
          </div>
          {step.value === 'main' && <Main />}
          {step.value === 'captcha' && <CaptchaView />}
          {(step.value === 'sms' || step.value === 'two-factor') && <SmsView />}
          {step.value === 'bind-mobile' && <BindMobile />}
          {step.value === 'cancel-close' && <CancelClose />}
          {step.value === 'recovery' && <Recovery />}
          {step.value === 'success' && <Success />}
        </main>
      </div>
    )
  },
})

export default LoginPage
