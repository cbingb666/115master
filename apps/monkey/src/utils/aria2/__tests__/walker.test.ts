import { describe, expect, it, vi } from 'vitest'

const getFiles = vi.fn()

vi.mock('$', () => ({
  GM_info: { userAgentData: { brands: [] } },
  GM_xmlhttpRequest: vi.fn(),
  GM_getValue: vi.fn(),
  GM_setValue: vi.fn(),
}))

vi.mock('@/utils/drive115', () => ({
  drive115: {
    getFiles: (...args: unknown[]) => getFiles(...args),
  },
}))

const { walkFolder } = await import('../walker')

function mkFile(pc: string, n: string, sha = 's') {
  return { pc, n, sha, s: 1 }
}

function mkDir(cid: string, n: string) {
  return { cid, n }
}

describe('walkFolder', () => {
  it('单层目录：两个文件', async () => {
    getFiles.mockResolvedValueOnce({
      state: true,
      data: [mkFile('p1', 'a.mp4'), mkFile('p2', 'b.mp4')],
      path: [{ name: 'root' }],
    })
    const out: unknown[] = []
    for await (const e of walkFolder('100', 'root', 0)) out.push(e)
    expect(out).toEqual([
      { pickCode: 'p1', name: 'a.mp4', relPath: 'root', sha1: 's', size: 1 },
      { pickCode: 'p2', name: 'b.mp4', relPath: 'root', sha1: 's', size: 1 },
    ])
  })

  it('两层嵌套：根下有一个子目录和一个文件', async () => {
    getFiles
      .mockResolvedValueOnce({
        state: true,
        data: [mkFile('p1', 'a.mp4'), mkDir('200', 'sub')],
        path: [{ name: 'root' }],
      })
      .mockResolvedValueOnce({
        state: true,
        data: [mkFile('p2', 'b.mp4')],
        path: [{ name: 'root' }, { name: 'sub' }],
      })
    const out: unknown[] = []
    for await (const e of walkFolder('100', 'root', 0)) out.push(e)
    expect(out).toContainEqual({
      pickCode: 'p1',
      name: 'a.mp4',
      relPath: 'root',
      sha1: 's',
      size: 1,
    })
    expect(out).toContainEqual({
      pickCode: 'p2',
      name: 'b.mp4',
      relPath: 'root/sub',
      sha1: 's',
      size: 1,
    })
  })

  it('失败 1 次后重试成功', async () => {
    getFiles
      .mockRejectedValueOnce(new Error('net'))
      .mockResolvedValueOnce({
        state: true,
        data: [mkFile('p1', 'a.mp4')],
        path: [{ name: 'root' }],
      })
    const out: unknown[] = []
    for await (const e of walkFolder('100', 'root', 0)) out.push(e)
    expect(out.length).toBe(1)
  })

  it('失败两次后抛出', async () => {
    getFiles
      .mockRejectedValueOnce(new Error('net1'))
      .mockRejectedValueOnce(new Error('net2'))
    await expect(async () => {
      for await (const _ of walkFolder('100', 'root', 0)) {
        /* drain */
      }
    }).rejects.toThrow()
  })
})
