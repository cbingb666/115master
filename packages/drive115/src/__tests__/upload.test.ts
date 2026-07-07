import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { UploadApiClient } from '../clients/upload/client.ts'
import type { Req } from '../clients/upload/index.ts'
import { multipartStream, multipartBodySize } from '../clients/upload/multipart.ts'
import { ossHostname, ossSign } from '../clients/upload/oss-multipart.ts'

function createMockRequest(get = vi.fn(), post = vi.fn()): IRequest {
  return { get, post, request: vi.fn() }
}

function jsonResponse(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data)))
}

function createClient(get = vi.fn(), post = vi.fn()) {
  const fetchRequest = createMockRequest(get, post)
  return {
    client: new UploadApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: null!,
    }),
    get,
    post,
  }
}

const mockUploadInfo = {
  object: 'fake_obj_1234567890abcdef1234567890ab',
  accessid: 'LTAI5tFakeAccessKeyId',
  host: 'https://example-bucket.oss-cn-shenzhen.aliyuncs.com',
  policy: 'eyJleHBpcmF0aW9uIjoiMjA5OS0xMi0zMVQyMzo1OTo1OVoiLCJjb25kaXRpb25zIjpbWyJjb250ZW50LWxlbmd0aC1yYW5nZSIsMCw1MzY4NzA5MTIwXV19',
  signature: 'FakeSignature1234567890abc=',
  expire: 4102444799,
  callback: 'eyJjYWxsYmFja1VybCI6Imh0dHA6Ly91cGxiLjExNS5jb20vMy4wL3NhbXBsZWNvbXBsZXRldXBsb2FkLnBocCIsImNhbGxiYWNrQm9keSI6InNoYTE9JHtzaGExfSZmaWxlbmFtZT0ke29iamVjdH0mZmlsZXNpemU9JHtzaXplfSZtaW1lVHlwZT0ke21pbWVUeXBlfSZoZWlnaHQ9JHtpbWFnZUluZm8uaGVpZ2h0fSZ3aWR0aD0ke2ltYWdlSW5mby53aWR0aH0mdXNlcmlkPTEwMDAwMDAwMSZ0YXJnZXQ9VV8xXzAmdXNlcmZuPWRHVnpkQzUwZUhRPSZidWNrZXQ9ZXhhbXBsZSZ1c2VyaXA9MS4yLjMuNCZ1c2VycG9ydD0xMjM0NSZzb3VyY2U9NCZjYl90b2tlbj1mYWtlX3Rva2VuX3BsYWNlaG9sZGVyXzMyY2giLCJjYWxsYmFja0JvZHlUeXBlIjoiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkIn0=',
}

describe('uploadApiClient', () => {
  describe('initUpload', () => {
    const params: Req.SampleInitUpload = {
      userid: '100000001',
      filename: 'test.txt',
      filesize: 1024,
      target: 'U_1_0',
    }

    it('POSTs to uplb.115.com with form-urlencoded body', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse(mockUploadInfo)),
      )

      const info = await client.initUpload(params)

      expect(post).toHaveBeenCalledTimes(1)
      const [url, opts] = post.mock.calls[0]
      expect(url).toContain('uplb.115.com')
      expect(url).toContain('sampleinitupload.php')
      expect(opts.headers['Content-Type']).toBe('application/x-www-form-urlencoded')
      expect(opts.body).toContain('userid=100000001')
      expect(opts.body).toContain('filename=test.txt')
      expect(opts.body).toContain('filesize=1024')
      expect(opts.body).toContain('target=U_1_0')

      expect(info.object).toBe('fake_obj_1234567890abcdef1234567890ab')
      expect(info.host).toBe('https://example-bucket.oss-cn-shenzhen.aliyuncs.com')
      expect(info.accessid).toBe('LTAI5tFakeAccessKeyId')
    })

    it('returns all OSS credential fields', async () => {
      const { client } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse(mockUploadInfo)),
      )

      const info = await client.initUpload(params)

      expect(info.object).toBeTruthy()
      expect(info.accessid).toBeTruthy()
      expect(info.host).toBeTruthy()
      expect(info.policy).toBeTruthy()
      expect(info.signature).toBeTruthy()
      expect(info.expire).toBeGreaterThan(0)
      expect(info.callback).toBeTruthy()
    })
  })

  describe('buildOssParams', () => {
    it('builds multipart params from upload info', () => {
      const { client } = createClient()

      const ossParams = client.buildOssParams(mockUploadInfo)

      expect(ossParams.key).toBe(mockUploadInfo.object)
      expect(ossParams.policy).toBe(mockUploadInfo.policy)
      expect(ossParams.OSSAccessKeyId).toBe(mockUploadInfo.accessid)
      expect(ossParams.success_action_status).toBe('200')
      expect(ossParams.callback).toBe(mockUploadInfo.callback)
      expect(ossParams.signature).toBe(mockUploadInfo.signature)
    })
  })

  describe('upload', () => {
    const mockResult = {
      state: true,
      message: '',
      code: 0,
      data: {
        aid: 1,
        area_id: 1,
        cid: '1000000000000000001',
        file_name: 'test.txt',
        file_ptime: 1783448985,
        file_status: 1,
        file_id: '1000000000000000002',
        file_size: '42',
        pick_code: 'fake_pick_code_123',
        sha1: 'FAKESHA1FAKESHA1FAKESHA1FAKESHA1FAKESHA1',
        sp: 0,
        file_type: 103,
        object_id: '',
        user_id: '100000001',
        is_video: 0,
      },
    }

    it('encapsulates initUpload + buildOssParams + OSS upload', async () => {
      const initPost = vi.fn().mockImplementation(() => jsonResponse(mockUploadInfo))
      const ossPost = vi.fn().mockImplementation(() => jsonResponse(mockResult))
      const { client } = createClient(
        vi.fn(),
        vi.fn().mockImplementation((url: string, opts: unknown) => {
          if (typeof url === 'string' && url.includes('uplb'))
            return initPost(url, opts)
          return ossPost(url, opts)
        }),
      )

      const file = new Blob(['hello world'])
      const result = await client.upload({
        file,
        filename: 'test.txt',
        userid: '100000001',
        target: 'U_1_0',
      })

      // initUpload was called with correct params
      expect(initPost).toHaveBeenCalledTimes(1)
      expect(ossPost).toHaveBeenCalledTimes(1)
      const initBody = initPost.mock.calls[0][1].body as string
      expect(initBody).toContain('userid=100000001')
      expect(initBody).toContain('filename=test.txt')
      expect(initBody).toContain('filesize=11')
      expect(initBody).toContain('target=U_1_0')

      // OSS upload was called with FormData
      const ossBody = ossPost.mock.calls[0][1].body as FormData
      expect(ossBody).toBeInstanceOf(FormData)

      // result has correct data
      expect(result.state).toBe(true)
      expect(result.data.file_name).toBe('test.txt')
      expect(result.data.file_id).toBe('1000000000000000002')
      expect(result.data.pick_code).toBe('fake_pick_code_123')
    })

    it('supports ReadableStream file with streaming upload', async () => {
      const initPost = vi.fn().mockImplementation(() => jsonResponse(mockUploadInfo))
      const ossPost = vi.fn().mockImplementation(() => jsonResponse(mockResult))
      const { client } = createClient(
        vi.fn(),
        vi.fn().mockImplementation((url: string, opts: unknown) => {
          if (url.includes('uplb')) return initPost(url, opts)
          return ossPost(url, opts)
        }),
      )

      const fileStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hello world'))
          controller.close()
        },
      })

      const result = await client.upload({
        file: fileStream,
        filename: 'test.txt',
        userid: '100000001',
        target: 'U_1_0',
        filesize: 11,
      })

      expect(initPost).toHaveBeenCalledTimes(1)
      expect(ossPost).toHaveBeenCalledTimes(1)

      const [, opts] = ossPost.mock.calls[0]
      expect(opts.headers['Content-Type']).toMatch(/^multipart\/form-data; boundary=/)
      expect(opts.headers['Content-Length']).toBeDefined()
      expect(opts.body).toBeInstanceOf(ReadableStream)

      expect(result.state).toBe(true)
      expect(result.data.file_name).toBe('test.txt')
    })
  })

  describe('uploadTarget', () => {
    it('generates target for file upload (aid=1)', async () => {
      const { uploadTarget } = await import('../clients/upload/req.ts')
      expect(uploadTarget(1, 0)).toBe('U_1_0')
      expect(uploadTarget(4, '1000000000000000001')).toBe('U_4_1000000000000000001')
    })

    it('generates target for different aids', async () => {
      const { uploadTarget } = await import('../clients/upload/req.ts')
      expect(uploadTarget(2, '123')).toBe('U_2_123')
      expect(uploadTarget(5, 0)).toBe('U_5_0')
      expect(uploadTarget(9, 0)).toBe('U_9_0')
    })

    it('shareTarget returns cid directly', async () => {
      const { shareTarget } = await import('../clients/upload/req.ts')
      expect(shareTarget('abc')).toBe('abc')
    })
  })
})

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  return result
}

async function readStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
  }
  return concat(chunks)
}

describe('multipartStream', () => {
  it('produces valid multipart body with fields and file content', async () => {
    const boundary = '----WebKitFormBoundarytest'
    const fields = [{ name: 'key', value: 'obj' }]
    const content = new Uint8Array([1, 2, 3])
    const fileStream = new ReadableStream({
      start(controller) {
        controller.enqueue(content)
        controller.close()
      },
    })

    const stream = multipartStream(fields, fileStream, 'test.bin', boundary)
    const body = await readStream(stream)
    const text = new TextDecoder().decode(body)

    expect(text).toContain(`--${boundary}`)
    expect(text).toContain('name="key"')
    expect(text).toContain('obj')
    expect(text).toContain('name="file"')
    expect(text).toContain('test.bin')
    expect(text).toContain(`--${boundary}--`)
    // file content should be present before closing boundary
    const tailStart = body.length - (`\r\n--${boundary}--\r\n`.length + content.length)
    expect(new TextDecoder().decode(body.slice(tailStart, tailStart + content.length)))
      .toBe(new TextDecoder().decode(content))
  })
})

describe('multipartBodySize', () => {
  it('matches actual stream byte count', async () => {
    const boundary = '----WebKitFormBoundarytest'
    const fields = [{ name: 'key', value: 'obj' }]
    const fileSize = 3

    const computed = multipartBodySize(fields, fileSize, 'test.bin', boundary)

    const fileStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(fileSize))
        controller.close()
      },
    })
    const stream = multipartStream(fields, fileStream, 'test.bin', boundary)
    const body = await readStream(stream)

    expect(computed).toBe(body.length)
  })
})

describe('getToken', () => {
  const mockStsToken = {
    StatusCode: '200',
    AccessKeyId: 'STS.FakeAccessKeyId',
    AccessKeySecret: 'FakeAccessKeySecret',
    SecurityToken: 'FakeSecurityToken',
    Expiration: '2026-07-07T21:25:28Z',
  }

  it('POSTs to gettoken.php with correct params', async () => {
    const { client, post } = createClient(
      vi.fn(),
      vi.fn().mockImplementation(() => jsonResponse(mockStsToken)),
    )

    const token = await client.getToken({
      userid: '340263991',
      filename: 'large.rar',
      filesize: 2_000_000_000,
      target: 'U_1_0',
    })

    expect(post).toHaveBeenCalledTimes(1)
    const [url, opts] = post.mock.calls[0]
    expect(url).toContain('gettoken.php')
    expect(opts.body).toContain('userid=340263991')
    expect(opts.body).toContain('filename=large.rar')
    expect(opts.body).toContain('filesize=2000000000')
    expect(opts.body).toContain('target=U_1_0')

    expect(token.AccessKeyId).toBe('STS.FakeAccessKeyId')
    expect(token.AccessKeySecret).toBe('FakeAccessKeySecret')
    expect(token.SecurityToken).toBe('FakeSecurityToken')
    expect(token.Expiration).toBe('2026-07-07T21:25:28Z')
  })
})

describe('getUploadInfo', () => {
  const mockUploadInfo = {
    endpoint: 'oss-cn-shenzhen.aliyuncs.com',
    bucket: 'fhnfile',
    gettokenurl: 'https://uplb.115.com/3.0/gettoken.php',
  }

  it('POSTs to getuploadinfo.php and returns config', async () => {
    const { client, post } = createClient(
      vi.fn(),
      vi.fn().mockImplementation(() => jsonResponse(mockUploadInfo)),
    )

    const info = await client.getUploadInfo({ userid: '340263991' })

    expect(post).toHaveBeenCalledTimes(1)
    const [url, opts] = post.mock.calls[0]
    expect(url).toContain('getuploadinfo.php')
    expect(opts.body).toContain('userid=340263991')

    expect(info.endpoint).toBe('oss-cn-shenzhen.aliyuncs.com')
    expect(info.bucket).toBe('fhnfile')
  })
})

describe('resumeUpload', () => {
  const mockResult = {
    state: true,
    message: '',
    code: 0,
    data: {
      aid: 1, area_id: 1, cid: '1',
      file_name: 'large.rar', file_ptime: 1783448985,
      file_status: 1, file_id: '2', file_size: '2000000000',
      pick_code: 'pick123', sha1: 'SHA1', sp: 0,
      file_type: 103, object_id: '', user_id: '340263991', is_video: 0,
    },
  }

  it('POSTs to resumeupload.php with correct params', async () => {
    const { client, post } = createClient(
      vi.fn(),
      vi.fn().mockImplementation(() => jsonResponse(mockResult)),
    )

    const result = await client.resumeUpload({
      userid: '340263991',
      filename: 'large.rar',
      filesize: 2_000_000_000,
      target: 'U_1_0',
      pickcode: 'pick123',
      object: 'large.rar.1234567890',
      uploadId: 'UPLOADID123',
    })

    expect(post).toHaveBeenCalledTimes(1)
    const [url, opts] = post.mock.calls[0]
    expect(url).toContain('resumeupload.php')
    expect(opts.body).toContain('userid=340263991')
    expect(opts.body).toContain('filename=large.rar')
    expect(opts.body).toContain('pickcode=pick123')
    expect(opts.body).toContain('object=large.rar.1234567890')
    expect(opts.body).toContain('uploadId=UPLOADID123')

    expect(result.state).toBe(true)
    expect(result.data.file_name).toBe('large.rar')
  })
})

describe('oss-multipart', () => {
  it('ossSign produces valid base64 signature', async () => {
    const date = 'Fri, 07 Jul 2026 12:00:00 GMT'
    const sig = await ossSign(
      'PUT', 'fhnfile', 'test.bin',
      'testsecret',
      date,
      { partNumber: '1', uploadId: 'UPLOADID' },
      { 'Content-Type': 'application/octet-stream', 'x-oss-security-token': 'token123' },
    )

    expect(sig).toBeTruthy()
    expect(typeof sig).toBe('string')
    // base64 字符集
    expect(sig).toMatch(/^[A-Za-z0-9+/=]+$/)
    // 对于 HMAC-SHA1，base64 输出长度固定为 28
    expect(sig.length).toBe(28)
  })

  it('ossSign with different params produces different signatures', async () => {
    const date = 'Fri, 07 Jul 2026 12:00:00 GMT'
    const sig1 = await ossSign('PUT', 'fhnfile', 'test.bin', 'secret', date, { partNumber: '1', uploadId: 'A' })
    const sig2 = await ossSign('PUT', 'fhnfile', 'test.bin', 'secret', date, { partNumber: '1', uploadId: 'B' })

    expect(sig1).not.toBe(sig2)
  })

  it('ossHostname builds hostname from info', () => {
    const hostname = ossHostname({
      endpoint: 'oss-cn-shenzhen.aliyuncs.com',
      bucket: 'fhnfile',
      gettokenurl: 'https://uplb.115.com/3.0/gettoken.php',
    })

    expect(hostname).toBe('fhnfile.oss-cn-shenzhen.aliyuncs.com')
  })
})
