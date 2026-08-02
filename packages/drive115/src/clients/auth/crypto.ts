import bigInt from 'big-integer'

interface Der {
  tag: number
  start: number
  end: number
  next: number
}

function der(bytes: Uint8Array, offset: number): Der {
  const tag = bytes[offset]
  const first = bytes[offset + 1]

  if (tag === undefined || first === undefined)
    throw new Error('登录公钥格式无效')

  if ((first & 0x80) === 0) {
    const start = offset + 2
    return { tag, start, end: start + first, next: start + first }
  }

  const count = first & 0x7F
  if (!count || count > 4)
    throw new Error('登录公钥长度无效')

  const length = Array.from(bytes.slice(offset + 2, offset + 2 + count))
    .reduce((value, byte) => value * 256 + byte, 0)
  const start = offset + 2 + count
  return { tag, start, end: start + length, next: start + length }
}

function hex(bytes: Uint8Array) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function decode(value: string) {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0))
}

function key(value: string) {
  const pem = value.includes('BEGIN') ? value : atob(value)
  const bytes = decode(pem.replace(/-----[^-]+-----|\s/g, ''))
  const root = der(bytes, 0)
  const first = der(bytes, root.start)

  if (first.tag === 0x02) {
    return {
      modulus: bytes.slice(first.start + (bytes[first.start] === 0 ? 1 : 0), first.end),
      exponent: bytes.slice(der(bytes, first.next).start, der(bytes, first.next).end),
    }
  }

  const bits = der(bytes, first.next)
  if (bits.tag !== 0x03)
    throw new Error('登录公钥内容无效')

  const body = bytes.slice(bits.start + 1, bits.end)
  const sequence = der(body, 0)
  const modulus = der(body, sequence.start)
  const exponent = der(body, modulus.next)

  if (modulus.tag !== 0x02 || exponent.tag !== 0x02)
    throw new Error('登录 RSA 参数无效')

  return {
    modulus: body.slice(modulus.start + (body[modulus.start] === 0 ? 1 : 0), modulus.end),
    exponent: body.slice(exponent.start, exponent.end),
  }
}

/** 115 网页登录使用的 RSAES-PKCS1-v1_5 加密。 */
export function encryptLogin(value: string, publicKey: string) {
  const parts = key(publicKey)
  const source = new TextEncoder().encode(value)
  const size = parts.modulus.length

  if (source.length > size - 11)
    throw new Error('登录密文长度超出公钥限制')

  const padding = new Uint8Array(size - source.length - 3)
  padding.forEach((_, index) => {
    const byte = new Uint8Array(1)
    do globalThis.crypto.getRandomValues(byte)
    while (byte[0] === 0)
    padding[index] = byte[0]
  })

  const block = new Uint8Array(size)
  block[1] = 2
  block.set(padding, 2)
  block.set(source, size - source.length)

  const encrypted = bigInt(hex(block), 16)
    .modPow(bigInt(hex(parts.exponent), 16), bigInt(hex(parts.modulus), 16))
    .toString(16)
    .padStart(size * 2, '0')
  const bytes = encrypted.match(/.{2}/g)?.map(value => Number.parseInt(value, 16)) ?? []
  return btoa(String.fromCharCode(...bytes))
}

/** 浏览器原生 SHA-1；115 登录协议要求十六进制小写摘要。 */
export async function sha1(value: string) {
  return hex(new Uint8Array(await globalThis.crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(value),
  )))
}

export function passwordLevel(value: string) {
  if (value.length <= 5)
    return 0

  const mask = Array.from(value).reduce((result, char) => {
    const code = char.charCodeAt(0)
    if (code >= 48 && code <= 57)
      return result | 1
    if (code >= 65 && code <= 90)
      return result | 2
    if (code >= 97 && code <= 122)
      return result | 4
    return result | 8
  }, 0)
  const groups = [1, 2, 4, 8].filter(bit => (mask & bit) !== 0).length
  return groups + (value.length > 8 ? 1 : 0)
}
