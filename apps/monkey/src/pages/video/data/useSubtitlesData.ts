import type { Subtitle } from '@/components/XPlayer/types'
import { useAsyncState } from '@vueuse/core'
import { shallowRef } from 'vue'
import { jaccardSimilarity } from '@/utils/array'
import { subtitlePreference } from '@/utils/cache/subtitlePreference'
import { drive115 } from '@/utils/drive115'
import { convertToUtf8Blob } from '@/utils/encoding'
import { fetchRequest } from '@/utils/request/fetchRequest'
import { removeFileExtension, splitWords } from '@/utils/string'
import { subtitlecat } from '@/utils/subtitle/subtitlecat'
import { thunderSubtitle } from '@/utils/subtitle/thunder'

/** 字幕数据 */
export function useDataSubtitles() {
  const currentId = shallowRef<string>()

  /** 通过 subtitleCat 获取字幕 */
  const getFromSubtitlecat = async (keyword: string): Promise<Subtitle[]> => {
    if (!keyword) {
      return []
    }
    const res = await subtitlecat.fetchSubtitle(keyword, 'zh-CN')
    const subtitles = res.map(subtitle => ({
      id: subtitle.id,
      label: subtitle.title,
      srclang: subtitle.targetLanguage,
      source: 'Subtitle Cat',
      raw: subtitle.raw,
      format: subtitle.format,
      kind: 'subtitles' as const,
    } satisfies Subtitle))
    return subtitles
  }

  /** 通过迅雷获取字幕 */
  const getFromThunder = async (filename: string): Promise<Subtitle[]> => {
    if (!filename) {
      return []
    }
    const res = await thunderSubtitle.fetchSubtitle(filename)
    const subtitles = res.map(subtitle => ({
      id: subtitle.id,
      label: removeFileExtension(subtitle.title),
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
    const res = await drive115.webApiGetMoviesSubtitle({
      pickcode,
    })
    const results = await Promise.allSettled(
      res.data.list.map(async (subtitle) => {
        const url = new URL(subtitle.url)
        url.protocol = 'https:'
        const res = await fetchRequest.get(url.href)
        const arrayBuffer = await res.arrayBuffer()
        const blob = await convertToUtf8Blob(arrayBuffer)
        return {
          id: subtitle.sid,
          url: url.href,
          raw: blob,
          label: `${removeFileExtension(subtitle.title)}`,
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
    return jaccardSimilarity(splitWords(a), splitWords(b))
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
          similarity: subtitle.source === 'Built-in' ? 1 : computedSimilarity(subtitle.label, filename),
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

  return subtitles
}
