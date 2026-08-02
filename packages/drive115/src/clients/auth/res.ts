export interface LoginData {
  userId?: string
  userName?: string
  mobile?: string
  country?: string
  sign?: string
  token?: string
  codeId?: string
  ssoMode?: string
  closeToken?: string
  cookies?: Record<string, string>
  raw: Record<string, unknown>
}

type OutcomeBase = LoginData & {
  code: number
  message: string
}

export type LoginOutcome
  = | (OutcomeBase & { kind: 'success' })
    | (OutcomeBase & { kind: 'captcha' })
    | (OutcomeBase & { kind: 'sms' })
    | (OutcomeBase & { kind: 'two-factor' })
    | (OutcomeBase & { kind: 'bind-mobile' })
    | (OutcomeBase & { kind: 'cancel-close' })
    | (OutcomeBase & { kind: 'locked' })
    | (OutcomeBase & { kind: 'appeal' })
    | (OutcomeBase & { kind: 'error', field?: string })

export interface QrcodeToken {
  uid: string
  time: string
  sign: string
  qrcode: string
}

export interface QrcodeStatus {
  status: -2 | -1 | 0 | 1 | 2
  code: number
  message: string
}

export interface ApiResult {
  state: boolean
  code: number
  message: string
  raw: Record<string, unknown>
}
