import type { Subtitle } from '@/components/XPlayer/types'
import { fetchRequest } from '@115master/shared'
import { subtitleSource, type ProcessedSubtitle } from '@115master/subtitle-source'
import { array, string } from '@115master/utils'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { subtitleCache } from '@/utils/cache/subtitleCache'
import { subtitlePreference } from '@/utils/cache/subtitlePreference'
import { drive115 } from '@/utils/drive115Instance'
import { GMRequestInstance } from '@/utils/request/gmRequest'

const subtitlecat = new subtitleSource.SubtitleCat({
  request: GMRequestInstance,
})

const thunder = new subtitleSource.Thunder({
  request: GMRequestInstance,
})

/** 字幕数据 */
export function useDataSubtitles() {
  const currentId = shallowRef<string>()

  /** 通过 subtitleCat 获取字幕 */
  const getFromSubtitlecat = async (keyword: string): Promise<Subtitle[]> => {
    if (!keyword)
      return []

    const cached = await subtitleCache.getCache(keyword, 'zh-CN')
    if (cached) {
      return cached.map(toSubtitle)
    }

    const res = await subtitlecat.fetchSubtitle(keyword, 'zh-CN')
    const subtitles = res.map(toSubtitle)

    if (subtitles.length > 0) {
      await subtitleCache.addCache(keyword, 'zh-CN', res.map(i => ({ ...i })))
    }

    return subtitles
  }

  const toSubtitle = (subtitle: ProcessedSubtitle): Subtitle => ({
    id: subtitle.id,
    label: subtitle.title,
    srclang: subtitle.targetLanguage,
    source: 'Subtitle Cat',
    raw: subtitle.raw,
    format: subtitle.format,
    kind: 'subtitles' as const,
  })

  /** 通过迅雷获取字幕 */
  const getFromThunder = async (filename: string): Promise<Subtitle[]> => {
    if (!filename) {
      return []
    }
    const res = await thunder.fetchSubtitle(filename)
    const subtitles = res.map(subtitle => ({
      id: subtitle.id,
      label: string.removeFileExtension(subtitle.title),
      srclang: 'zh-CN',
      source: 'Thunder',
      raw: subtitle.raw,
      format: subtitle.format,
      kind: 'subtitles' as const,
    } satisfies Subtitle))
    return subtitles
  }

  /** 通过 115 获取字幕 */
  const getFrom115 = async (pickcode: string): Promise<Subtitle[]> => {
    const res = await drive115.file.getMoviesSubtitle({
      pickcode,
    })
    const results = await Promise.allSettled(
      res.data.list.map(async (subtitle) => {
        const url = new URL(subtitle.url)
        url.protocol = 'https://'
        const res = await fetchRequest.get(url.href)
        const blob = await res.blob()
        return {
          id: subtitle.sid,
          url: url.href,
          raw: blob,
          label: `${string.removeFileExtension(subtitle.title)}`,
          source: subtitle.file_id ? 'Upload' : 'Built-in',
          srclang: subtitle.language || 'zh-CN',
          format: subtitle.type,
          kind: 'subtitles' as const,
        } satisfies Subtitle
      }),
    )
    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<Subtitle>).value)
  }

  /** 计算相似度 */
  const computedSimilarity = (a: string, b: string) => {
    return array.jaccardSimilarity(string.splitWords(a), string.splitWords(b))
  }

  /** 字幕数据 */
  const subtitles = useAsyncState<Subtitle[]>(
    async (pickcode: string, filename: string, keyword: string): Promise<Subtitle[]> => {
      currentId.value = pickcode
      const preference = await subtitlePreference.getPreference(pickcode)
      if (currentId.value !== pickcode) {
        return []
      }
      /** 并行获取所有来源的字幕 */
      const results = await Promise.allSettled([
        getFromSubtitlecat(keyword),
        getFromThunder(filename),
        getFrom115(pickcode),
      ])

      if (currentId.value !== pickcode) {
        return []
      }

      const subtitles = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<Subtitle[]>).value)
        .flat()
        .map(subtitle => ({
          ...subtitle,
          similarity: computedSimilarity(subtitle.label, filename),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .map(subtitle => ({
          ...subtitle,
          default: preference ? preference.id === subtitle.id : false,
        }))

      return subtitles
    },
    [],
    {
      immediate: false,
    },
  )

  const clear = () => {
    subtitles.execute(0, '')
    currentId.value = undefined
  }

  return {
    ...subtitles,
    clear,
  }
}
