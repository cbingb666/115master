import type { Aria2Settings } from './types'

export function buildAria2Headers(input: {
  settings: Aria2Settings
  cookie: string
  browserUserAgent: string
}): string[] {
  const { settings, cookie, browserUserAgent } = input
  const ua = settings.useBrowserUA ? browserUserAgent : settings.userAgent
  const out: string[] = []
  if (ua)
    out.push(`User-Agent: ${ua}`)
  if (settings.referer)
    out.push(`Referer: ${settings.referer}`)
  if (cookie)
    out.push(`Cookie: ${cookie}`)
  if (settings.extraHeaders) {
    settings.extraHeaders.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && trimmed.includes(':')) {
        out.push(trimmed)
      }
    })
  }
  return out
}
