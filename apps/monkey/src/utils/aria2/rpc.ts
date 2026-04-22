import type { ParsedRpcUrl } from './types'
import { GMRequest } from '@/utils/request/gmRequst'

export function parseRpcUrl(raw: string): ParsedRpcUrl {
  const u = new URL(raw)
  const endpoint = `${u.origin}${u.pathname}`

  let auth: ParsedRpcUrl['auth']
  if (u.username) {
    const pass = decodeURIComponent(u.password)
    const full = `${u.username}:${pass}`
    if (u.username === 'token') {
      auth = { mode: 'token', token: full }
    }
    else {
      auth = { mode: 'basic', header: `Basic ${btoa(full)}` }
    }
  }

  const options: Record<string, string> = {}
  if (u.hash.length > 1) {
    const params = new URLSearchParams(u.hash.slice(1))
    for (const [k, v] of params.entries()) {
      options[k] = v.length ? v : 'enabled'
    }
  }

  return { endpoint, auth, options }
}

export interface AddUriRequest {
  url: string
  out: string
  headers: string[]
  downloadPath: string
  sha1?: string
  sha1Check: boolean
  fragmentOptions: Record<string, string>
}

export interface AddUriPayload {
  jsonrpc: '2.0'
  method: 'aria2.addUri'
  id: number
  params: unknown[]
}

export function buildAddUriPayload(
  parsed: ParsedRpcUrl,
  req: AddUriRequest,
): AddUriPayload {
  const options: Record<string, unknown> = {
    out: req.out,
    header: req.headers,
    ...req.fragmentOptions,
  }
  if (req.downloadPath) {
    options.dir = req.downloadPath
  }
  if (req.sha1Check && req.sha1) {
    options.checksum = `sha-1=${req.sha1}`
  }

  const params: unknown[] = [[req.url], options]
  if (parsed.auth?.mode === 'token') {
    params.unshift(parsed.auth.token)
  }

  return {
    jsonrpc: '2.0',
    method: 'aria2.addUri',
    id: Date.now(),
    params,
  }
}

const rpcRequest = new GMRequest({ cache: 'no-cache' }, 'aria2-rpc')

async function postJsonRpc(
  parsed: ParsedRpcUrl,
  payload: unknown,
): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (parsed.auth?.mode === 'basic') {
    headers.Authorization = parsed.auth.header
  }
  const resp = await rpcRequest.request(parsed.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    timeout: 5000,
  })
  if (!resp.ok) {
    throw new Error(`RPC HTTP ${resp.status}`)
  }
  const json = (await resp.json()) as {
    result?: unknown
    error?: { message: string }
  }
  if (json.error) {
    throw new Error(`RPC error: ${json.error.message}`)
  }
  return json.result
}

export async function sendAddUri(
  rpcUrl: string,
  req: AddUriRequest,
): Promise<string> {
  const parsed = parseRpcUrl(rpcUrl)
  const payload = buildAddUriPayload(parsed, req)
  const result = await postJsonRpc(parsed, payload)
  return String(result)
}

export async function getAria2Version(rpcUrl: string): Promise<string> {
  const parsed = parseRpcUrl(rpcUrl)
  const params: unknown[] = []
  if (parsed.auth?.mode === 'token') {
    params.push(parsed.auth.token)
  }
  const payload = {
    jsonrpc: '2.0',
    method: 'aria2.getVersion',
    id: Date.now(),
    params,
  }
  const result = (await postJsonRpc(parsed, payload)) as { version: string }
  return result.version
}
