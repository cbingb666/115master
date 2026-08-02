export interface Captcha {
  code: string
  sign: string
}

export interface Login {
  account: string
  password: string
  country?: string
  goto?: string
  remember?: boolean
  captcha?: Captcha
  smsCode?: string
}

export type SmsTemplate = 'verify_code' | 'login_from_two_step'

export interface SendSms {
  userId: string
  template: SmsTemplate
  captcha?: Captcha
}

export interface Verify {
  userId: string
  code: string
  codeId?: string
  ssoMode?: string
}
