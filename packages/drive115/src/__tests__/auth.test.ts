import type { IRequest } from '@115master/shared'
import { Buffer } from 'node:buffer'
import { constants, generateKeyPairSync, privateDecrypt } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { AuthApiClient, classifyLoginResponse } from '../clients/auth/client.ts'
import { encryptLogin, passwordLevel, sha1 } from '../clients/auth/crypto.ts'
import { Crypto115 } from '../core/crypto.ts'

function response(value: unknown) {
  return Promise.resolve(new Response(typeof value === 'string' ? value : JSON.stringify(value)))
}

function request(get = vi.fn(), post = vi.fn()): IRequest {
  return { get, post, request: vi.fn() }
}

function client(api: IRequest, options = {}) {
  return new AuthApiClient({
    fetchRequest: api,
    proApiRequest: api,
    crypto115: new Crypto115(),
  }, options)
}

describe('登录响应状态', () => {
  it.each([
    [40101010, 'two-factor'],
    [70128, 'two-factor'],
    [10098, 'captcha'],
    [40101004, 'captcha'],
    [40103000, 'captcha'],
    [90059, 'sms'],
    [90065, 'bind-mobile'],
    [40101030, 'bind-mobile'],
    [40111010, 'cancel-close'],
    [70001, 'locked'],
    [40101007, 'locked'],
    [70006, 'appeal'],
    [90060, 'appeal'],
    [40101008, 'appeal'],
    [40101012, 'appeal'],
    [40101048, 'appeal'],
  ] as const)('错误码 %i -> %s', (code, kind) => {
    expect(classifyLoginResponse({ state: false, err_code: code })).toMatchObject({ kind, code })
  })

  it('合并挑战数据并保留成功登录 Cookie', () => {
    expect(classifyLoginResponse({
      state: 1,
      data: {
        user_id: 115,
        user_name: 'Master',
        cookie: { UID: '115_A1_1', CID: 2 },
      },
    })).toMatchObject({
      kind: 'success',
      userId: '115',
      userName: 'Master',
      cookies: { UID: '115_A1_1', CID: '2' },
    })
  })

  it('未知错误保留字段名和消息', () => {
    expect(classifyLoginResponse({
      state: false,
      err_code: 42,
      err_name: 'account',
      err_msg: '账号错误',
    })).toMatchObject({
      kind: 'error',
      code: 42,
      field: 'account',
      message: '账号错误',
    })
  })
})

describe('网页登录协议', () => {
  it('构造动态公钥登录参数并携带验证码与短信码', async () => {
    const get = vi.fn().mockImplementation(() => response({ state: true, data: { key: 'public-key' } }))
    const post = vi.fn().mockImplementation(() => response({
      state: true,
      data: { user_id: 115, cookie: { UID: 'cookie' } },
    }))
    const api = request(get, post)
    const auth = client(api, {
      now: () => 1_700_000_000_000,
      nonce: () => 'abc123',
      encrypt: (value: string, key: string) => `encrypted:${value}:${key}`,
    })

    const outcome = await auth.login({
      account: ' 115 ',
      password: 'Secret123!',
      remember: true,
      captcha: { code: '120', sign: 'captcha-sign' },
      smsCode: '4567',
    })

    const data = post.mock.calls[0]?.[1]?.data as Record<string, unknown>
    const password = await sha1('Secret123!')
    const account = await sha1('115')

    expect(get).toHaveBeenCalledWith(
      'https://passportapi.115.com/app/1.0/web/5.0.1/login/getKey',
    )
    expect(post.mock.calls[0]?.[0]).toBe(
      'https://passportapi.115.com/app/1.0/web/1.0/login/login',
    )
    expect(data).toMatchObject({
      'login[ssoent]': 'A1',
      'login[version]': '2.0',
      'login[ssoln]': '115',
      'login[pwd_level]': 5,
      'login[ssovcode]': 'abc123',
      'login[ssoext]': 'abc123',
      'login[time]': 1,
      'login[code]': '120',
      'login[sid]': 'captcha-sign',
      'login[scode]': '4567',
      'account': '115',
      'passwd': `encrypted:${password}_1700000000:public-key`,
      'time': 1_700_000_000,
    })
    expect(data['login[ssopw]']).toBe(
      await sha1(`${await sha1(`${password}${account}`)}ABC123`),
    )
    expect(outcome).toMatchObject({ kind: 'success', userId: '115' })
  })

  it('公钥过期时获取新公钥并只重试一次', async () => {
    const get = vi.fn()
      .mockImplementationOnce(() => response({ state: true, data: { key: 'old' } }))
      .mockImplementationOnce(() => response({ state: true, data: { key: 'new' } }))
    const post = vi.fn()
      .mockImplementationOnce(() => response({ state: false, err_code: 40101060 }))
      .mockImplementationOnce(() => response({ state: true, data: { user_id: 115 } }))
    const encrypt = vi.fn((value: string, key: string) => `${key}:${value}`)
    const auth = client(request(get, post), {
      now: () => 1_700_000_000_000,
      nonce: () => 'nonce',
      encrypt,
    })

    await expect(auth.login({ account: '115', password: 'password' })).resolves.toMatchObject({ kind: 'success' })
    expect(get).toHaveBeenCalledTimes(2)
    expect(post).toHaveBeenCalledTimes(2)
    expect(encrypt.mock.calls.map(call => call[1])).toEqual(['old', 'new'])
  })

  it('支持验证码 JSONP，并识别短信发送前的人机验证', async () => {
    const get = vi.fn().mockImplementation(() => response('callback({"state":true,"sign":"sid"});'))
    const post = vi.fn().mockImplementation(() => response({ state: false, code: 20026, message: '需要验证' }))
    const auth = client(request(get, post))

    await expect(auth.getCaptchaSign()).resolves.toBe('sid')
    const result = await auth.sendSms({ userId: '115', template: 'login_from_two_step' })
    expect(auth.isSmsCaptchaRequired(result)).toBe(true)
  })

  it('通过网页端安全验证接口提交四字点选结果', async () => {
    const post = vi.fn().mockImplementation(() => response({
      state: false,
      errcode: 911,
      message: '验证未通过',
    }))
    const auth = client(request(vi.fn(), post))

    await expect(auth.verifyCaptcha({
      code: '1935',
      sign: 'captcha-sign',
    })).resolves.toMatchObject({
      state: false,
      code: 911,
      message: '验证未通过',
    })
    expect(post).toHaveBeenCalledWith(
      'https://webapi.115.com/user/captcha',
      {
        data: {
          code: '1935',
          sign: 'captcha-sign',
          ac: 'security_code',
          type: 'web',
          ctype: 'web',
          client: 'web',
        },
      },
    )
  })

  it('通过官方网页端接口退出当前登录态', async () => {
    const get = vi.fn().mockImplementation(() => response(''))
    const auth = client(request(get))

    await expect(auth.logout()).resolves.toBeUndefined()
    expect(get).toHaveBeenCalledWith(
      'https://passportapi.115.com/app/1.0/web/1.0/logout/logout/?goto=https%3A%2F%2F115.com',
      {
        redirect: 'manual',
        timeout: 15_000,
      },
    )
  })
})

describe('登录加密', () => {
  it('使用 RSAES-PKCS1-v1_5 生成可由对应私钥解密的密文', () => {
    const pair = generateKeyPairSync('rsa', { modulusLength: 1024 })
    const pem = pair.publicKey.export({ type: 'spki', format: 'pem' }).toString()
    const cipher = encryptLogin('hello_115', btoa(pem))

    expect(privateDecrypt({
      key: pair.privateKey,
      padding: constants.RSA_PKCS1_PADDING,
    }, Buffer.from(cipher, 'base64')).toString()).toBe('hello_115')
  })

  it('按官方规则计算密码强度', () => {
    expect(passwordLevel('12345')).toBe(0)
    expect(passwordLevel('123456')).toBe(1)
    expect(passwordLevel('Secret123!')).toBe(5)
  })
})
