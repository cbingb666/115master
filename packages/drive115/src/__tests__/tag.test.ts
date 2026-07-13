import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { TagApiClient } from '../clients/tag/index.ts'
import { LabelColor } from '../clients/tag/req.ts'
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
    client: new TagApiClient({
      fetchRequest,
      proApiRequest: fetchRequest,
      crypto115: new Crypto115(),
    }),
    get,
    post,
  }
}

describe('tagApiClient', () => {
  describe('getLabels', () => {
    it('returns label list when state is true', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: {
            total: 2,
            sort: 'update_time',
            order: 'desc',
            list: [
              { id: '1', name: '标签A', color: '#FF4B30', sort: '0', update_time: 1700000000, create_time: 1690000000 },
              { id: '2', name: '标签B', color: '#2670FC', sort: '1', update_time: 1700000001, create_time: 1690000001 },
            ],
          },
        })),
      )

      const res = await client.getLabels({ offset: 0, limit: 11500 })

      expect(res.state).toBe(true)
      expect(res.data?.list).toHaveLength(2)
      expect(res.data?.list?.[0]?.name).toBe('标签A')
      expect(get).toHaveBeenCalledTimes(1)
      const url = get.mock.calls[0][0] as string
      expect(url).toContain('/label/list')
      expect(get.mock.calls[0][1]).toEqual({ params: { offset: 0, limit: 11500 } })
    })

    it('handles empty list', async () => {
      const { client } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: { total: 0, list: [] },
        })),
      )

      const res = await client.getLabels({ offset: 0, limit: 50 })

      expect(res.state).toBe(true)
      expect(res.data?.list).toEqual([])
      expect(res.data?.total).toBe(0)
    })

    it('passes sort/order params', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({ state: true, data: { list: [] } })),
      )

      await client.getLabels({ offset: 0, limit: 100, sort: 'create_time', order: 'asc' })

      expect(get.mock.calls[0][1]).toEqual({
        params: { offset: 0, limit: 100, sort: 'create_time', order: 'asc' },
      })
    })
  })

  describe('searchLabels', () => {
    it('appends keyword param to /label/list', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({ state: true, data: { list: [] } })),
      )

      await client.searchLabels({ offset: 0, limit: 50, keyword: '电影' })

      const params = (get.mock.calls[0][1] as { params: Record<string, unknown> }).params
      expect(params.keyword).toBe('电影')
      expect(get.mock.calls[0][0]).toContain('/label/list')
    })
  })

  describe('addLabels', () => {
    it('builds name[] entries with \x07 separator and color', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          data: [
            { id: '99', name: '新增标签', color: '#FF4B30', sort: 0, create_time: 1700000000, update_time: 1700000000 },
          ],
        })),
      )

      const res = await client.addLabels([
        { name: '新增标签', color: LabelColor.Red },
        { name: '另一个', color: '#2670FC' },
      ])

      expect(res.state).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(post).toHaveBeenCalledTimes(1)

      const url = post.mock.calls[0][0] as string
      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(url).toContain('/label/add_multi')
      expect(data['name[0]']).toBe('新增标签\x07#FF4B30')
      expect(data['name[1]']).toBe('另一个\x07#2670FC')
    })

    it('serializes the blank sentinel as the API empty color', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          code: 0,
          message: '',
          data: [{ id: '99', name: 'NoColor', color: '' }],
        })),
      )

      const res = await client.addLabels([{ name: 'NoColor', color: LabelColor.Blank }])

      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(data['name[0]']).toBe('NoColor\x07')
      expect(res.data?.[0]?.color).toBe('')
    })

    it('maps the API message field on failure', async () => {
      const { client } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({
          state: false,
          code: 21003,
          message: '该标签已存在。',
        })),
      )

      const res = await client.addLabels([{ name: '重复标签' }])

      expect(res.state).toBe(false)
      expect(res.code).toBe(21003)
      expect(res.message).toBe('该标签已存在。')
    })
  })

  describe('editLabel', () => {
    it('posts to /label/edit with id/name/color', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      const res = await client.editLabel({
        id: '42',
        name: '已编辑',
        color: '#43BA80',
      })

      expect(res.state).toBe(true)
      const url = post.mock.calls[0][0] as string
      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(url).toContain('/label/edit')
      expect(data).toEqual({ id: '42', name: '已编辑', color: '#43BA80' })
    })

    it('serializes the blank sentinel as an empty color', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      await client.editLabel({
        id: '42',
        name: '已清除颜色',
        color: LabelColor.Blank,
      })

      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(data).toEqual({ id: '42', name: '已清除颜色', color: '' })
    })

    it('omits color when not provided', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      await client.editLabel({ id: '42', name: '改名' })

      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(data).toEqual({ id: '42', name: '改名' })
      expect(data.color).toBeUndefined()
    })
  })

  describe('deleteLabel', () => {
    it('posts to /label/delete with id', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      const res = await client.deleteLabel({ id: '88' })

      expect(res.state).toBe(true)
      const url = post.mock.calls[0][0] as string
      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(url).toContain('/label/delete')
      expect(data).toEqual({ id: '88' })
    })
  })

  describe('setFileLabels', () => {
    it('joins label ids by comma and POSTs to /files/edit', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      const res = await client.setFileLabels('fid-001', ['10', '20', '30'])

      expect(res.state).toBe(true)
      const url = post.mock.calls[0][0] as string
      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(url).toContain('/files/edit')
      expect(data).toEqual({ fid: 'fid-001', file_label: '10,20,30' })
    })

    it('sends empty file_label to clear labels', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      await client.clearFileLabels('fid-001')

      const data = (post.mock.calls[0][1] as { data: Record<string, string> }).data
      expect(data.file_label).toBe('')
    })
  })

  describe('setLabelOrder', () => {
    it('posts to /files/order with module=label_search', async () => {
      const { client, post } = createClient(
        vi.fn(),
        vi.fn().mockImplementation(() => jsonResponse({ state: true })),
      )

      await client.setLabelOrder({
        file_id: '55',
        user_order: 'file_name',
        user_asc: 1,
      })

      const url = post.mock.calls[0][0] as string
      const data = (post.mock.calls[0][1] as { data: Record<string, unknown> }).data
      expect(url).toContain('/files/order')
      expect(data.module).toBe('label_search')
      expect(data.file_id).toBe('55')
      expect(data.user_order).toBe('file_name')
      expect(data.user_asc).toBe(1)
    })
  })

  describe('getFilesByLabel', () => {
    it('gETs /files/search with file_label and default cid=0', async () => {
      const { client, get } = createClient(
        vi.fn().mockImplementation(() => jsonResponse({
          state: true,
          count: 1,
          data: [{ fid: 'f1', n: 'video.mp4', fl: '10' }],
          order: 'user_utime',
          is_asc: 0,
          offset: 0,
          cur: 0,
        })),
      )

      const res = await client.getFilesByLabel({
        offset: 0,
        limit: 50,
        file_label: '10',
      })

      expect(res.state).toBe(true)
      expect(res.data).toHaveLength(1)
      expect(res.data?.[0]?.fl).toBe('10')

      const url = get.mock.calls[0][0] as string
      const params = (get.mock.calls[0][1] as { params: Record<string, unknown> }).params
      expect(url).toContain('/files/search')
      expect(params.file_label).toBe('10')
      expect(params.cid).toBe('0')
      expect(params.aid).toBe(1)
    })
  })
})
