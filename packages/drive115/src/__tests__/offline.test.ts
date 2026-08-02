import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { OfflineApiClient } from '../clients/offline/index.ts'
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
    client: new OfflineApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    }),
    get,
    post,
  }
}

const SIGN = { uid: '123', sign: 'sign-abc', time: 1700000000 }

describe('offlineApiClient', () => {
  describe('getOfflineDownloadPath', () => {
    it('gets /offine/downpath on webapi with default limit', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: [{ file_id: '2502978638394956106', file_name: '云下载' }],
        })),
      )

      const res = await client.getOfflineDownloadPath()

      expect(res.state).toBe(true)
      expect(res.data?.[0]?.file_name).toBe('云下载')
      expect(get.mock.calls[0][0]).toContain('webapi.115.com/offine/downpath')
      expect(get.mock.calls[0][1]).toEqual({ params: { limit: 1150 } })
    })
  })

  describe('postOfflineTaskLists', () => {
    it('posts to ac=task_lists with default page 1', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          count: 1,
          quota: 99,
          page_count: 1,
          page: 1,
          page_row: 20,
          total: 1,
          tasks: [
            {
              info_hash: 'abc123',
              name: 'movie.mkv',
              size: 1024,
              url: 'magnet:?xt=urn:btih:abc123',
              file_id: '2502978638394956106',
              add_time: 1700000000,
              last_update: 1700000100,
              left_time: -1,
              peers: 0,
              percentDone: 100,
              rateDownload: 0,
              move: 1,
              status: 2,
            },
          ],
        })),
      )

      const res = await client.postOfflineTaskLists(SIGN)

      expect(res.state).toBe(true)
      expect(res.count).toBe(1)
      expect(res.tasks?.[0]?.info_hash).toBe('abc123')
      expect(res.tasks?.[0]?.percentDone).toBe(100)

      const url = post.mock.calls[0][0] as string
      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(url).toContain('115.com/web/lixian/')
      expect(options.params).toEqual({ ct: 'lixian', ac: 'task_lists' })
      expect(options.data.page).toBe(1)
      expect(options.data.sign).toBe(SIGN.sign)
    })

    it('respects the given page', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true, count: 0, tasks: [] })),
      )

      await client.postOfflineTaskLists({ ...SIGN, page: 3 })

      const options = post.mock.calls[0][1] as { data: Record<string, unknown> }
      expect(options.data.page).toBe(3)
    })
  })

  describe('postOfflineAddUrl', () => {
    it('posts to ac=add_task_url with url and wp_path_id', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          info_hash: 'abc123',
          url: 'magnet:?xt=urn:btih:abc123',
        })),
      )

      const res = await client.postOfflineAddUrl({
        ...SIGN,
        url: 'magnet:?xt=urn:btih:abc123',
        wp_path_id: '0',
      })

      expect(res.state).toBe(true)
      expect(res.info_hash).toBe('abc123')

      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(options.params).toEqual({ ct: 'lixian', ac: 'add_task_url' })
      expect(options.data.url).toBe('magnet:?xt=urn:btih:abc123')
      expect(options.data.wp_path_id).toBe('0')
    })
  })

  describe('postOfflineTorrent', () => {
    it('posts to ac=torrent with pickcode and sha1', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          info_hash: 'abc123',
          torrent_name: 'movie',
          file_size: 2048,
          file_count: 2,
          torrent_filelist_web: [
            { path: 'movie/a.mkv', size: 1024, wanted: 1 },
            { path: 'movie/b.srt', size: 1024, wanted: 0 },
          ],
        })),
      )

      const res = await client.postOfflineTorrent({
        ...SIGN,
        pickcode: 'pc123',
        sha1: 'sha123',
      })

      expect(res.state).toBe(true)
      expect(res.torrent_name).toBe('movie')
      expect(res.torrent_filelist_web).toHaveLength(2)
      expect(res.torrent_filelist_web?.[1]?.wanted).toBe(0)

      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(options.params).toEqual({ ct: 'lixian', ac: 'torrent' })
      expect(options.data.pickcode).toBe('pc123')
      expect(options.data.sha1).toBe('sha123')
    })
  })

  describe('postOfflineAddTaskBt', () => {
    it('posts to ac=add_task_bt with info_hash/wanted/savepath', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true, info_hash: 'abc123' })),
      )

      const res = await client.postOfflineAddTaskBt({
        ...SIGN,
        info_hash: 'abc123',
        wanted: '0,2,3',
        savepath: 'movie',
      })

      expect(res.state).toBe(true)

      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(options.params).toEqual({ ct: 'lixian', ac: 'add_task_bt' })
      expect(options.data).toMatchObject({
        info_hash: 'abc123',
        wanted: '0,2,3',
        savepath: 'movie',
      })
    })
  })

  describe('postOfflineTaskDel', () => {
    it('posts to ac=task_del with hash entries and flag', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      const res = await client.postOfflineTaskDel({
        ...SIGN,
        'hash[0]': 'abc123',
        'hash[1]': 'def456',
        'flag': 1,
      })

      expect(res.state).toBe(true)

      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(options.params).toEqual({ ct: 'lixian', ac: 'task_del' })
      expect(options.data['hash[0]']).toBe('abc123')
      expect(options.data['hash[1]']).toBe('def456')
      expect(options.data.flag).toBe(1)
    })
  })

  describe('postOfflineTaskClear', () => {
    it('posts to ac=task_clear with flag', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      const res = await client.postOfflineTaskClear({ ...SIGN, flag: 1 })

      expect(res.state).toBe(true)

      const options = post.mock.calls[0][1] as { params: Record<string, unknown>, data: Record<string, unknown> }
      expect(options.params).toEqual({ ct: 'lixian', ac: 'task_clear' })
      expect(options.data.flag).toBe(1)
    })
  })
})
