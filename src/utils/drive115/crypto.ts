import md5 from 'blueimp-md5'
import { Rsa115 } from './rsa'

export interface M115EncodeResult {
  data: string
  key: number[]
}

export class Crypto115 {
  private rsa: Rsa115
  private kts: number[]
  private keyS: number[]
  private keyL: number[]

  constructor() {
    this.rsa = new Rsa115()
    this.kts = [
      240,
      229,
      105,
      174,
      191,
      220,
      191,
      138,
      26,
      69,
      232,
      190,
      125,
      166,
      115,
      184,
      222,
      143,
      231,
      196,
      69,
      218,
      134,
      196,
      155,
      100,
      139,
      20,
      106,
      180,
      241,
      170,
      56,
      1,
      53,
      158,
      38,
      105,
      44,
      134,
      0,
      107,
      79,
      165,
      54,
      52,
      98,
      166,
      42,
      150,
      104,
      24,
      242,
      74,
      253,
      189,
      107,
      151,
      143,
      77,
      143,
      137,
      19,
      183,
      108,
      142,
      147,
      237,
      14,
      13,
      72,
      62,
      215,
      47,
      136,
      216,
      254,
      254,
      126,
      134,
      80,
      149,
      79,
      209,
      235,
      131,
      38,
      52,
      219,
      102,
      123,
      156,
      126,
      157,
      122,
      129,
      50,
      234,
      182,
      51,
      222,
      58,
      169,
      89,
      52,
      102,
      59,
      170,
      186,
      129,
      96,
      72,
      185,
      213,
      129,
      156,
      248,
      108,
      132,
      119,
      255,
      84,
      120,
      38,
      95,
      190,
      232,
      30,
      54,
      159,
      52,
      128,
      92,
      69,
      44,
      155,
      118,
      213,
      27,
      143,
      204,
      195,
      184,
      245,
    ]
    this.keyS = [0x29, 0x23, 0x21, 0x5E]
    this.keyL = [120, 6, 173, 76, 51, 134, 93, 24, 76, 1, 63, 70]
  }

  xor115Enc(
    src: number[],
    srclen: number,
    key: number[],
    keylen: number,
  ): number[] {
    const mod4 = srclen % 4
    const ret: number[] = []

    for (let i = 0; i < mod4; i++) {
      ret.push(src[i] ^ key[i % keylen])
    }

    for (let i = mod4; i < srclen; i++) {
      ret.push(src[i] ^ key[(i - mod4) % keylen])
    }

    return ret
  }

  getkey(length: number, key?: number[]): number[] {
    if (key) {
      const results: number[] = []
      for (let i = 0; i < length; i++) {
        const v1 = (key[i] + this.kts[length * i]) & 0xFF
        const v2 = this.kts[length * (length - 1 - i)]
        results.push(v1 ^ v2)
      }
      return results
    }
    return length === 12 ? this.keyL.slice(0) : this.keyS.slice(0)
  }

  asymEncode(src: number[], srclen: number): string {
    const m = 128 - 11
    let ret = ''
    for (let i = 0; i < Math.floor((srclen + m - 1) / m); i++) {
      ret += this.rsa.encrypt(
        this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen))),
      )
    }
    return btoa(this.rsa.hex2a(ret))
  }

  asymDecode(src: number[], srclen: number): number[] {
    const m = 128
    let ret = ''
    for (let i = 0; i < Math.floor((srclen + m - 1) / m); i++) {
      ret += this.rsa.decrypt(
        this.bytesToString(src.slice(i * m, Math.min((i + 1) * m, srclen))),
      )
    }
    return this.stringToBytes(ret)
  }

  symEncode(
    src: number[],
    srclen: number,
    key1: number[],
    key2?: number[],
  ): number[] {
    const k1 = this.getkey(4, key1)
    const k2 = this.getkey(12, key2)
    let ret = this.xor115Enc(src, srclen, k1, 4)
    ret.reverse()
    ret = this.xor115Enc(ret, srclen, k2, 12)
    return ret
  }

  symDecode(
    src: number[],
    srclen: number,
    key1: number[],
    key2: number[],
  ): number[] {
    const k1 = this.getkey(4, key1)
    const k2 = this.getkey(12, key2)
    let ret = this.xor115Enc(src, srclen, k2, 12)
    ret.reverse()
    ret = this.xor115Enc(ret, srclen, k1, 4)
    return ret
  }

  bytesToString(buf: number[]): string {
    return buf.map(b => String.fromCharCode(b)).join('')
  }

  stringToBytes(str: string): number[] {
    return Array.from(str).map(c => c.charCodeAt(0))
  }

  m115_encode(str: string, timestamp: string): M115EncodeResult {
    const key = this.stringToBytes(md5(`!@###@#${timestamp}DFDR@#@#`))
    let temp = this.stringToBytes(str)
    temp = this.symEncode(temp, temp.length, key)
    temp = key.slice(0, 16).concat(temp)
    return {
      data: this.asymEncode(temp, temp.length),
      key,
    }
  }

  m115_decode(str: string, key: number[]): string {
    let temp = this.stringToBytes(atob(str))
    temp = this.asymDecode(temp, temp.length)
    return this.bytesToString(
      this.symDecode(temp.slice(16), temp.length - 16, key, temp.slice(0, 16)),
    )
  }
}
