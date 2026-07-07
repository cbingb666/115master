import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { ExtractApiClient } from '../clients/extract/client.ts'
import { Crypto115 } from '../core/crypto.ts'

function createMockRequest(get = vi.fn(), post = vi.fn()): IRequest {
  return { get, post, request: vi.fn() }
}

function jsonResponse(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data)))
}

function createClient(get = vi.fn(), post = vi.fn()) {
  const fetchRequest = createMockRequest(get, post)
  return {
    client: new ExtractApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    }),
    get,
    post,
  }
}

describe('extractApiClient', () => {
  const pickCode = 'e571fd3bea27zzzdt'

  describe('getExtractStatus', () => {
    it('returns status when state is true', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          code: '',
          error: '',
          data: { extract_status: { unzip_status: 1, progress: 50 } },
        })),
      )

      const res = await client.getExtractStatus(pickCode)

      expect(res.state).toBe(true)
      expect(res.data.extract_status.unzip_status).toBe(1)
      expect(res.data.extract_status.progress).toBe(50)
      expect(get).toHaveBeenCalledTimes(1)
      expect(get.mock.calls[0][0]).toContain('push_extract')
      expect(get.mock.calls[0][1]).toEqual({ params: { pick_code: pickCode } })
    })

    it('handles unzip_status=0 (not started)', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { extract_status: { unzip_status: 0, progress: 0 } },
        })),
      )

      const res = await client.getExtractStatus(pickCode)

      expect(res.state).toBe(true)
      expect(res.data.extract_status.unzip_status).toBe(0)
    })

    it('handles unzip_status=6 (need password)', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { extract_status: { unzip_status: 6, progress: 0 } },
        })),
      )

      const res = await client.getExtractStatus(pickCode)

      expect(res.data.extract_status.unzip_status).toBe(6)
    })

    it('maps error codes', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: false,
          errNo: 51001,
          error: 'no permission',
        })),
      )

      const res = await client.getExtractStatus(pickCode)

      expect(res.state).toBe(false)
      expect(res.code).toBe(51001)
    })
  })

  describe('startExtract', () => {
    it('initiates extraction via POST', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { unzip_status: 1 },
        })),
      )

      const res = await client.startExtract({ pick_code: pickCode })

      expect(res.state).toBe(true)
      expect(res.data.unzip_status).toBe(1)
      expect(post).toHaveBeenCalledTimes(1)
      expect(post.mock.calls[0][0]).toContain('push_extract')
    })

    it('sends secret when provided', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { unzip_status: 1 },
        })),
      )

      await client.startExtract({ pick_code: pickCode, secret: 'mypassword' })

      expect(post).toHaveBeenCalledWith(
        expect.stringContaining('push_extract'),
        expect.objectContaining({ data: expect.objectContaining({ secret: 'mypassword' }) }),
      )
    })
  })

  describe('getExtractInfo', () => {
    it('returns file list', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: {
            list: [
              { file_category: 0, file_name: 'subdir', size: 0, time: '2026-07-07 21:34' },
              { file_category: 1, file_name: 'readme.txt', size: 1024, time: '2026-07-07 21:35' },
            ],
            has_file: 'false',
            next_marker: '',
          },
        })),
      )

      const res = await client.getExtractInfo({ pick_code: pickCode, paths: '文件' })

      expect(res.state).toBe(true)
      expect(res.data.list).toHaveLength(2)
      expect(res.data.list[0].file_category).toBe(0)
      expect(res.data.list[1].file_name).toBe('readme.txt')
      expect(get).toHaveBeenCalledTimes(1)
    })

    it('handles pagination with has_file=true', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: {
            list: [],
            has_file: 'true',
            next_marker: 'next_page_token',
          },
        })),
      )

      const res = await client.getExtractInfo({ pick_code: pickCode, next_marker: 'prev' })

      expect(res.state).toBe(true)
      expect(res.data.has_file).toBe('true')
      expect(res.data.next_marker).toBe('next_page_token')
    })
  })

  describe('addExtractFile', () => {
    it('saves files to drive directory', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { extract_id: 'extract_123' },
        })),
      )

      const res = await client.addExtractFile({
        pick_code: pickCode,
        extract_file: ['readme.txt'],
        extract_dir: [],
        to_pid: '0',
        paths: '文件',
      })

      expect(res.state).toBe(true)
      expect(res.data.extract_id).toBe('extract_123')
      expect(post).toHaveBeenCalledTimes(1)
    })
  })

  describe('getAddExtractProgress', () => {
    it('polls save progress', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { percent: 75 },
        })),
      )

      const res = await client.getAddExtractProgress({ extract_id: 'extract_123' })

      expect(res.state).toBe(true)
      expect(res.data.percent).toBe(75)
      expect(get).toHaveBeenCalledTimes(1)
    })

    it('returns 100 when complete', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { percent: 100 },
        })),
      )

      const res = await client.getAddExtractProgress({ extract_id: 'extract_123' })

      expect(res.data.percent).toBe(100)
    })
  })

  describe('getExtractFolders', () => {
    it('returns folder file list', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: [
            { pt: 'subdir', fn: 'file1.txt' },
            { pt: 'subdir', fn: 'file2.txt' },
          ],
        })),
      )

      const res = await client.getExtractFolders({
        pick_code: pickCode,
        full_dir_name: 'subdir',
      })

      expect(res.state).toBe(true)
      expect(res.data).toHaveLength(2)
      expect(res.data[0].fn).toBe('file1.txt')
      expect(get).toHaveBeenCalledTimes(1)
    })
  })

  describe('verifyExtractCount', () => {
    it('returns true when within limit', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { limit_state: true },
        })),
      )

      const res = await client.verifyExtractCount({
        pick_code: pickCode,
        full_dir_name: 'dir1',
        full_file_name: 'file1.txt',
      })

      expect(res.state).toBe(true)
      expect(res.data.limit_state).toBe(true)
      expect(post).toHaveBeenCalledTimes(1)
    })
  })

  describe('getExtractDownFile', () => {
    it('returns download URL', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { url: 'https://download.115.com/file' },
        })),
      )

      const res = await client.getExtractDownFile({
        dl: 1,
        pick_code: pickCode,
        full_name: 'readme.txt',
      })

      expect(res.state).toBe(true)
      expect(res.data.url).toBe('https://download.115.com/file')
      expect(get).toHaveBeenCalledTimes(1)
    })

    it('handles file_url_302 redirect', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { file_url_302: 'https://redirect.115.com/file' },
        })),
      )

      const res = await client.getExtractDownFile({
        dl: 1,
        pick_code: pickCode,
        full_name: 'large_file.zip',
      })

      expect(res.state).toBe(true)
      expect(res.data.file_url_302).toBe('https://redirect.115.com/file')
    })
  })

  describe('full extraction flow', () => {
    it('simulates: query -> start -> poll', async () => {
      const { client, post } = createClient(
        vi.fn()
          .mockImplementationOnce(() => jsonResponse({
            state: true,
            data: { extract_status: { unzip_status: 0, progress: 0 } },
          }))
          .mockImplementationOnce(() => jsonResponse({
            state: true,
            data: { extract_status: { unzip_status: 1, progress: 100 } },
          }))
          .mockImplementationOnce(() => jsonResponse({
            state: true,
            data: { extract_status: { unzip_status: 4, progress: 100 } },
          })),
        vi.fn()
          .mockImplementationOnce(() => jsonResponse({
            state: true,
            data: { unzip_status: 1 },
          })),
      )

      // Step 1: query status
      const s1 = await client.getExtractStatus(pickCode)
      expect(s1.data.extract_status.unzip_status).toBe(0)

      // Step 2: start extraction (POST)
      const s2 = await client.startExtract({ pick_code: pickCode })
      expect(s2.state).toBe(true)
      expect(s2.data.unzip_status).toBe(1)
      expect(post).toHaveBeenCalledTimes(1)

      // Step 3: poll progress
      const s3 = await client.getExtractStatus(pickCode)
      expect(s3.data.extract_status.unzip_status).toBe(1)
      expect(s3.data.extract_status.progress).toBe(100)

      // Step 4: extraction complete
      const s4 = await client.getExtractStatus(pickCode)
      expect(s4.data.extract_status.unzip_status).toBe(4)
    })
  })
})
