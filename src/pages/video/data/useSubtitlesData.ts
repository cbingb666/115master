import type { Subtitle } from '../../../components/XPlayer/types'
import { useAsyncState } from '@vueuse/core'
import { subtitlePreference } from '../../../utils/cache/subtitlePreference'
import { drive115 } from '../../../utils/drive115'
import { fetchRequest } from '../../../utils/request/fetchRequest'
import { filenameJaccardSimilarity } from '../../../utils/string'
import { subtitlecat } from '../../../utils/subtitle/subtitlecat'
import {
  convertSrtToVtt,
  vttToBlobUrl,
} from '../../../utils/subtitle/subtitleTool'

/** 字幕数据 */
export function useDataSubtitles() {
  /** 通过 subtitleCat 获取字幕 */
  const getFromSubtitlecat = async (keyword: string) => {
    if (!keyword) {
      return []
    }
    const res = await subtitlecat.fetchSubtitle(keyword, 'zh-CN')
    return res.map(subtitle => ({
      id: subtitle.id,
      url: subtitle.url,
      label: subtitle.title,
      srclang: subtitle.targetLanguage,
      source: 'Subtitle Cat',
      kind: 'subtitles' as const,
    }))
  }

  /** 通过 115 获取字幕 */
  const getFrom115 = async (pickcode: string) => {
    const res = await drive115.webApiGetMoviesSubtitle({
      pickcode,
    })
    return Promise.all(
      res.data.list.map(async (subtitle) => {
        const url = new URL(subtitle.url)
        url.protocol = 'https://'
        const vttText = await fetchRequest.get(url.href)
        return {
          id: subtitle.sid,
          url: vttToBlobUrl(convertSrtToVtt(await vttText.text())),
          label: `${subtitle.title}`,
          source: subtitle.file_id ? 'Upload' : 'Built-in',
          srclang: subtitle.language || 'zh-CN',
          kind: 'subtitles' as const,
        }
      }),
    )
  }

  /** 排序字幕 */
  const sortSubtitles = (subtitles: Subtitle[], filename: string) => {
    return subtitles.sort((a, b) => {
      const similarityA = filenameJaccardSimilarity(a.label, filename)
      const similarityB = filenameJaccardSimilarity(b.label, filename)
      return similarityB - similarityA
    })
  }

  /** 字幕数据 */
  const subtitles = useAsyncState<Subtitle[]>(
    async (pickcode: string, filename: string, keyword: string) => {
      const preference = await subtitlePreference.getPreference(pickcode)
      const subtitleCats = await getFromSubtitlecat(keyword)
      const subtitles115 = await getFrom115(pickcode)

      return [
        ...sortSubtitles(subtitleCats, filename),
        ...sortSubtitles(subtitles115, filename),
      ].map((s) => {
        return {
          ...s,
          default: preference ? preference.id === s.id : false,
        }
      })
    },
    [],
    {
      immediate: false,
    },
  )

  return subtitles
}
