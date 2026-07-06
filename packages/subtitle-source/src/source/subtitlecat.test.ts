import type { IRequest } from '@115master/shared'
import { describe, expect, it, vi } from 'vitest'
import { SubtitleCat } from './subtitlecat.ts'

function createMockResponse(body: () => string | Blob): Response {
  return {
    json: () => Promise.resolve(body()),
    blob: () => Promise.resolve(body() as Blob),
    text: () => Promise.resolve(String(body())),
  } as Response
}

function createMockRequest(get: (url: string) => Promise<Response>): IRequest {
  return {
    get,
    post: vi.fn(),
    request: vi.fn(),
  } as unknown as IRequest
}

function createSearchHtml(items: Array<{
  title: string
  href: string
  downloads: number
  comment: 'up' | 'down' | 'none'
  originLanguage: string
}>): string {
  const rows = items.map(item => `
    <tr>
      <td>
        <a href="${item.href}">${item.title}</a>
        translated from ${item.originLanguage}
      </td>
      <td>
        ${item.comment === 'up' ? '<i class="fa-thumbs-up"></i>' : ''}
        ${item.comment === 'down' ? '<i class="fa-thumbs-down"></i>' : ''}
      </td>
      <td>${item.downloads} downloads</td>
    </tr>
  `).join('')

  return `
    <html>
      <body>
        <table class="sub-table">
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
}

function createDownloadHtml(language: string, href: string): string {
  return `
    <html>
      <body>
        <a id="download_${language}" href="${href}">Download</a>
      </body>
    </html>
  `
}

describe('subtitleSource.SubtitleCat', () => {
  const keyword = 'movie.mp4'
  const language = 'zh-CN'

  it('returns empty array for empty keyword', async () => {
    const request = createMockRequest(vi.fn())
    const cat = new SubtitleCat({ request })

    const result = await cat.fetchSubtitle('', language)

    expect(result).toEqual([])
    expect(request.get).not.toHaveBeenCalled()
  })

  it('fetches, parses and downloads subtitles', async () => {
    const searchHtml = createSearchHtml([
      { title: keyword, href: '/sub/1', downloads: 100, comment: 'up', originLanguage: 'en' },
    ])
    const downloadHtml = createDownloadHtml(language, '/download/1.zip')

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      if (url.includes('/sub/1')) {
        return Promise.resolve(createMockResponse(() => downloadHtml))
      }
      if (url.includes('/download/1.zip')) {
        return Promise.resolve(createMockResponse(() => new Blob(['subtitle content'])))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe(keyword)
    expect(result[0].format).toBe('srt')
  })

  it('filters rows that do not match keyword', async () => {
    const searchHtml = createSearchHtml([
      { title: keyword, href: '/sub/1', downloads: 100, comment: 'up', originLanguage: 'en' },
      { title: 'other-movie', href: '/sub/2', downloads: 50, comment: 'none', originLanguage: 'en' },
    ])
    const downloadHtml = createDownloadHtml(language, '/download/1.zip')

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      if (url.includes('/sub/1')) {
        return Promise.resolve(createMockResponse(() => downloadHtml))
      }
      if (url.includes('/download/1.zip')) {
        return Promise.resolve(createMockResponse(() => new Blob(['subtitle content'])))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe(keyword)
  })

  it('handles rows with missing fields', async () => {
    const searchHtml = `
      <html>
        <body>
          <table class="sub-table">
            <tbody>
              <tr>
                <td>just text</td>
                <td></td>
                <td>no number</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    const request = createMockRequest(vi.fn().mockResolvedValue(createMockResponse(() => searchHtml)))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toEqual([])
  })

  it('handles rows without downloads cell', async () => {
    const searchHtml = `
      <html>
        <body>
          <table class="sub-table">
            <tbody>
              <tr>
                <td><a href="/sub/1">movie.mp4</a> translated from en</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      if (url.includes('/sub/1')) {
        return Promise.resolve(createMockResponse(() => createDownloadHtml(language, '/download/1.zip')))
      }
      if (url.includes('/download/1.zip')) {
        return Promise.resolve(createMockResponse(() => new Blob(['subtitle content'])))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toHaveLength(1)
    expect(result[0].downloads).toBe(0)
  })

  it('sorts results by comment then downloads', async () => {
    const searchHtml = createSearchHtml([
      { title: keyword, href: '/sub/1', downloads: 10, comment: 'up', originLanguage: 'en' },
      { title: keyword, href: '/sub/2', downloads: 100, comment: 'none', originLanguage: 'en' },
      { title: keyword, href: '/sub/3', downloads: 5, comment: 'down', originLanguage: 'en' },
    ])

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      const match = url.match(/\/sub\/(\d)/)
      if (match) {
        return Promise.resolve(createMockResponse(() => createDownloadHtml(language, `/download/${match[1]}.zip`)))
      }
      const downloadMatch = url.match(/\/download\/(\d)\.zip/)
      if (downloadMatch) {
        return Promise.resolve(createMockResponse(() => new Blob([`subtitle ${downloadMatch[1]}`])))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toHaveLength(3)
    expect(result[0].comment).toBe(1)
    expect(result[1].comment).toBe(0)
    expect(result[2].comment).toBe(-1)
    expect(result[1].downloads).toBeGreaterThan(result[2].downloads)
  })

  it('sorts results with same comment by downloads', async () => {
    const searchHtml = createSearchHtml([
      { title: keyword, href: '/sub/1', downloads: 10, comment: 'up', originLanguage: 'en' },
      { title: keyword, href: '/sub/2', downloads: 100, comment: 'up', originLanguage: 'en' },
    ])

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      const match = url.match(/\/sub\/(\d)/)
      if (match) {
        return Promise.resolve(createMockResponse(() => createDownloadHtml(language, `/download/${match[1]}.zip`)))
      }
      const downloadMatch = url.match(/\/download\/(\d)\.zip/)
      if (downloadMatch) {
        return Promise.resolve(createMockResponse(() => new Blob([`subtitle ${downloadMatch[1]}`])))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toHaveLength(2)
    expect(result[0].comment).toBe(1)
    expect(result[0].downloads).toBe(100)
    expect(result[1].downloads).toBe(10)
  })

  it('filters out items that fail to process', async () => {
    const searchHtml = createSearchHtml([
      { title: keyword, href: '/sub/1', downloads: 100, comment: 'up', originLanguage: 'en' },
    ])

    const request = createMockRequest(vi.fn().mockImplementation((url: string) => {
      if (url.includes('/index.php?search=')) {
        return Promise.resolve(createMockResponse(() => searchHtml))
      }
      if (url.includes('/sub/1')) {
        return Promise.resolve(createMockResponse(() => '<html><body></body></html>'))
      }
      return Promise.reject(new Error(`unexpected url: ${url}`))
    }))
    const cat = new SubtitleCat({ request})

    const result = await cat.fetchSubtitle(keyword, language)

    expect(result).toEqual([])
  })
})
