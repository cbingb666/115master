import type { Drive115CoreDeps } from '../../core/deps.ts'
import type { Req, Res } from './index.ts'
import { Drive115Error, Drive115ErrorCode, toDrive115Error, toResult } from '../../core/error.ts'
import { URL_115 } from '../../share/constant.ts'
import { BaseApiClient } from '../base.ts'
import { encryptLogin, passwordLevel, sha1 } from './crypto.ts'

const CAPTCHA_CODES = new Set([10098, 40101004, 40103000])
const CAPTCHA_SMS_CODES = new Set([20026, 20028, 20038])
const TWO_FACTOR_CODES = new Set([70128, 40101010])
const BIND_MOBILE_CODES = new Set([90065, 40101030])
const LOCKED_CODES = new Set([70001, 40101007])
const APPEAL_CODES = new Set([70006, 90060, 40101008, 40101012, 40101048])

interface LoginKey {
  value: string
  time: number
}

export interface AuthApiOptions {
  now?: () => number
  nonce?: () => string
  encrypt?: (value: string, publicKey: string) => string
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {}
}

function text(value: unknown) {
  if (typeof value === 'string')
    return value
  if (typeof value === 'number')
    return value.toString()
  return undefined
}

function field(data: Record<string, unknown>, ...keys: string[]) {
  return keys.map(name => text(data[name])).find(Boolean)
}

function code(data: Record<string, unknown>) {
  return Number(data.err_code ?? data.errno ?? data.errNo ?? data.code ?? 0)
}

function message(data: Record<string, unknown>) {
  return field(data, 'err_msg', 'message', 'error_msg', 'error') ?? ''
}

function cookies(value: unknown) {
  const data = record(value)
  return Object.fromEntries(
    Object.entries(data)
      .map(([name, value]) => [name, text(value)] as const)
      .filter((entry): entry is readonly [string, string] => entry[1] !== undefined),
  )
}

/** 将 115 登录响应收敛成 MasterApp 可直接驱动的认证状态。 */
export function classifyLoginResponse(value: unknown): Res.LoginOutcome {
  const body = record(value)
  const data = record(body.data)
  const merged = { ...body, ...data }
  const result = {
    code: code(merged),
    message: message(merged),
    userId: field(merged, 'user_id', 'USER_ID'),
    userName: field(merged, 'user_name', 'USER_NAME', 'UESR_NAME'),
    mobile: field(merged, 'mobile'),
    country: field(merged, 'country'),
    sign: field(merged, 'sign'),
    token: field(merged, 'token'),
    codeId: field(merged, 'code_id'),
    ssoMode: field(merged, 'sso_mode'),
    closeToken: field(merged, 'close_token'),
    cookies: cookies(merged.cookie),
    raw: body,
  }

  if (TWO_FACTOR_CODES.has(result.code))
    return { ...result, kind: 'two-factor' }
  if (body.state)
    return { ...result, kind: 'success' }
  if (CAPTCHA_CODES.has(result.code))
    return { ...result, kind: 'captcha' }
  if (result.code === 90059)
    return { ...result, kind: 'sms' }
  if (BIND_MOBILE_CODES.has(result.code))
    return { ...result, kind: 'bind-mobile' }
  if (result.code === 40111010)
    return { ...result, kind: 'cancel-close' }
  if (LOCKED_CODES.has(result.code))
    return { ...result, kind: 'locked' }
  if (APPEAL_CODES.has(result.code))
    return { ...result, kind: 'appeal' }
  return { ...result, kind: 'error', field: field(merged, 'err_name') }
}

async function json(response: Response) {
  const source = await response.text()
  try {
    return record(JSON.parse(source))
  }
  catch {
    const match = source.match(/^[^(]*\((.*)\)\s*;?$/s)
    if (match?.[1]) {
      try {
        return record(JSON.parse(match[1]))
      }
      catch {}
    }
    throw new Drive115Error('115 登录接口返回了无效数据', Drive115ErrorCode.DecodeError)
  }
}

function result(value: unknown): Res.ApiResult {
  const raw = record(value)
  return {
    state: Boolean(raw.state),
    code: code(raw),
    message: message(raw),
    raw,
  }
}

function defaultNonce() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8))
  return `${Date.now().toString(16)}${Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')}`
}

/** 登录、验证码与异常验证 API。挑战响应作为状态返回，网络/解码异常才抛错。 */
export class AuthApiClient extends BaseApiClient {
  private key?: LoginKey
  private options: AuthApiOptions

  constructor(deps: Drive115CoreDeps, options: AuthApiOptions = {}) {
    super(deps)
    this.options = options
  }

  async login(params: Req.Login): Promise<Res.LoginOutcome> {
    return this.call(this.loginWithKey(params))
  }

  async getQrcodeToken(signal?: AbortSignal): Promise<Res.QrcodeToken> {
    return this.call((async () => {
      const raw = await json(await this.proApiRequest.get(
        new URL('/api/1.0/web/1.0/token', URL_115.QRCODE_API).href,
        { signal },
      ))
      const data = record(raw.data)
      const token = {
        uid: field(data, 'uid') ?? '',
        time: field(data, 'time') ?? '',
        sign: field(data, 'sign') ?? '',
        qrcode: field(data, 'qrcode') ?? '',
      }
      if (!raw.state || !token.uid || !token.time || !token.sign)
        throw new Drive115Error(message(raw) || '无法获取登录二维码', Drive115ErrorCode.DecodeError)
      return token
    })())
  }

  async getQrcodeStatus(token: Res.QrcodeToken, signal?: AbortSignal): Promise<Res.QrcodeStatus> {
    return this.call((async () => {
      const raw = await json(await this.proApiRequest.get(
        new URL('/get/status/', URL_115.QRCODE_API).href,
        {
          params: {
            uid: token.uid,
            time: token.time,
            sign: token.sign,
            _: Math.floor(this.now() / 1000),
          },
          signal,
          timeout: 35_000,
        },
      ))
      return {
        status: Number(record(raw.data).status ?? -1) as Res.QrcodeStatus['status'],
        code: code(raw),
        message: message(raw),
      }
    })())
  }

  async loginQrcode(uid: string): Promise<Res.LoginOutcome> {
    return this.call((async () => classifyLoginResponse(await json(await this.proApiRequest.post(
      new URL('/app/1.0/web/1.0/login/qrcode', URL_115.PASSPORT_API).href,
      { data: { account: uid, app: 'web' }, timeout: 15_000 },
    ))))())
  }

  getQrcodeImage(uid: string, nonce = this.now()) {
    const url = new URL('/api/1.0/web/1.0/qrcode', URL_115.QRCODE_API)
    url.searchParams.set('qrfrom', '1')
    url.searchParams.set('uid', uid)
    url.searchParams.set('_', nonce.toString())
    return url.href
  }

  async getCaptchaSign(signal?: AbortSignal) {
    return this.call((async () => {
      const url = new URL('/?ac=code&t=sign', URL_115.CAPTCHA_API)
      url.searchParams.set('callback', 'masterCaptcha')
      const raw = await json(await this.proApiRequest.get(
        url.href,
        { signal },
      ))
      const sign = field(raw, 'sign')
      if (!raw.state || !sign)
        throw new Drive115Error(message(raw) || '无法加载验证码', Drive115ErrorCode.DecodeError)
      return sign
    })())
  }

  getCaptchaImage(type: 'prompt' | 'single' | 'all', id?: number, nonce = this.now()) {
    const url = new URL('/', URL_115.CAPTCHA_API)
    url.searchParams.set('ct', 'index')
    url.searchParams.set('ac', 'code')
    if (type === 'all')
      url.searchParams.set('t', 'all')
    if (type === 'single') {
      url.searchParams.set('t', 'single')
      url.searchParams.set('id', id?.toString() ?? '0')
    }
    url.searchParams.set('_t', nonce.toString())
    return url.href
  }

  async sendSms(params: Req.SendSms): Promise<Res.ApiResult> {
    return this.call((async () => result(await json(await this.proApiRequest.post(
      new URL('/app/1.0/web/1.0/code/sms/login', URL_115.PASSPORT_API).href,
      {
        data: {
          tpl: params.template,
          user_id: params.userId,
          cv21: 2,
          ...(params.captcha && {
            code: params.captcha.code,
            sid: params.captcha.sign,
          }),
        },
      },
    ))))())
  }

  isSmsCaptchaRequired(value: Res.ApiResult) {
    return CAPTCHA_SMS_CODES.has(value.code)
  }

  async verify(params: Req.Verify): Promise<Res.LoginOutcome> {
    return this.call((async () => classifyLoginResponse(await json(await this.proApiRequest.post(
      new URL('/app/1.0/web/1.0/login/vip', URL_115.PASSPORT_API).href,
      {
        data: {
          account: params.userId,
          code: params.code,
          ...(params.codeId && { code_id: params.codeId }),
          ...(params.ssoMode && { sso_mode: params.ssoMode }),
        },
      },
    ))))())
  }

  async cancelClose(closeToken: string): Promise<Res.LoginOutcome> {
    return this.call((async () => classifyLoginResponse(await json(await this.proApiRequest.post(
      new URL('/app/1.0/web/1.0/close/cancel', URL_115.PASSPORT_API).href,
      { data: { close_token: closeToken } },
    ))))())
  }

  /** 退出当前网页端登录态。官方接口以重定向响应清除 115 Cookie。 */
  async logout(): Promise<void> {
    return this.call((async () => {
      const url = new URL('/app/1.0/web/1.0/logout/logout/', URL_115.PASSPORT_API)
      url.searchParams.set('goto', URL_115.NORMAL)
      const response = await this.proApiRequest.get(url.href, {
        redirect: 'manual',
        timeout: 15_000,
      })

      if (response.status >= 400) {
        throw new Drive115Error('退出登录失败，请稍后重试', Drive115ErrorCode.Unknown, {
          statusCode: response.status,
          url: url.href,
        })
      }
    })())
  }

  private now() {
    return this.options.now?.() ?? Date.now()
  }

  private async call<T>(payload: Promise<T>) {
    try {
      return await payload
    }
    catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError')
        throw cause
      const error = toDrive115Error(cause)
      await this.deps.onError?.(toResult(error))
      throw error
    }
  }

  private async getKey(force = false): Promise<LoginKey> {
    if (this.key && !force && this.now() - this.key.time < 10 * 60 * 1000)
      return this.key

    const raw = await json(await this.proApiRequest.get(
      new URL('/app/1.0/web/5.0.1/login/getKey', URL_115.PASSPORT_API).href,
    ))
    const value = field(record(raw.data), 'key')
    if (!raw.state || !value)
      throw new Drive115Error(message(raw) || '无法获取 115 登录公钥', Drive115ErrorCode.DecodeError)
    this.key = { value, time: this.now() }
    return this.key
  }

  private async payload(params: Req.Login, key: LoginKey) {
    const ext = this.options.nonce?.() ?? defaultNonce()
    const password = await sha1(params.password)
    const account = await sha1(params.account.trim())
    const proof = await sha1(`${await sha1(`${password}${account}`)}${ext.toUpperCase()}`)
    const timestamp = Math.floor(this.now() / 1000)
    const encrypt = this.options.encrypt ?? encryptLogin

    return {
      'login[ssoent]': 'A1',
      'login[version]': '2.0',
      'login[ssoln]': params.account.trim(),
      'login[pwd_level]': passwordLevel(params.password),
      'login[ssovcode]': ext,
      'login[ssoext]': ext,
      'login[ssopw]': proof,
      'login[safe]': 1,
      'login[time]': params.remember ? 1 : 0,
      'login[safe_login]': 0,
      'from_browser': 1,
      'cipher_ver': 2,
      'account': params.account.trim(),
      'country': params.country ?? '',
      'goto': params.goto ?? URL_115.NORMAL,
      'passwd': encrypt(`${password}_${timestamp}`, key.value),
      'time': Math.floor(key.time / 1000),
      ...(params.captcha && {
        'login[code]': params.captcha.code,
        'login[sid]': params.captcha.sign,
        'code': params.captcha.code,
        'code_id': params.captcha.sign,
      }),
      ...(params.smsCode && {
        'login[scode]': params.smsCode,
        'code': params.smsCode,
      }),
    }
  }

  private async loginWithKey(params: Req.Login, retry = true): Promise<Res.LoginOutcome> {
    const key = await this.getKey(!retry)
    const raw = await json(await this.proApiRequest.post(
      new URL('/app/1.0/web/1.0/login/login', URL_115.PASSPORT_API).href,
      { data: await this.payload(params, key), timeout: 15_000 },
    ))
    if (code(raw) === 40101060 && retry)
      return this.loginWithKey(params, false)
    return classifyLoginResponse(raw)
  }
}
