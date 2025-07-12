import type { Subtitle } from '../types'
import type { PlayerContext } from './usePlayerProvide'
import { computed, ref, watch } from 'vue'

/**
 * 字幕
 */
export function useSubtitles(ctx: PlayerContext) {
  /** 是否准备就绪 */
  const ready = ref(false)
  /** 当前字幕 */
  const current = ref<Subtitle | null>(null)
  /** 上一个字幕 */
  const previousSubtitle = ref<Subtitle | null>(null)
  /** 默认字幕 */
  const defaultSubtitle = computed(() => {
    return (
      ctx.rootProps.subtitles.value?.find(s => s.default)
      ?? ctx.rootProps.subtitles.value?.[0]
      ?? null
    )
  })

  /** 切换字幕 */
  const change = (subtitle: Subtitle | null) => {
    if (subtitle) {
      previousSubtitle.value = subtitle
    }
    current.value = subtitle
    ctx.rootProps.onSubtitleChange?.(subtitle)
  }

  /** 切换字幕开关 */
  const toggleEnabled = () => {
    if (current.value) {
      change(null)
    }
    else if (previousSubtitle.value) {
      change(previousSubtitle.value)
    }
    else {
      change(defaultSubtitle.value ?? null)
    }
  }

  /** 设置默认字幕 */
  const restoreLastSubtitle = (subtitles: Subtitle[]) => {
    const defaultSubtitle = subtitles.find(s => s.default)
    if (defaultSubtitle) {
      change(defaultSubtitle)
    }
  }

  /** 恢复当前字幕 */
  const restoreCurrentSubtitle = () => {
    if (current.value) {
      change(current.value)
    }
  }

  // 监听字幕列表变化，设置默认字幕
  watch(ctx.rootProps.subtitles, (newSubtitles) => {
    ready.value = true
    if (newSubtitles) {
      restoreLastSubtitle(newSubtitles)
    }
  })

  // 监听视频源变化，设置默认字幕
  watch(
    () => ctx.source?.current,
    (newSource) => {
      if (newSource) {
        restoreCurrentSubtitle()
      }
    },
  )

  return {
    list: ctx.rootProps.subtitles,
    loading: ctx.rootProps.subtitlesLoading,
    ready: ctx.rootProps.subtitlesReady,
    current,
    change,
    toggleEnabled,
    restoreCurrentSubtitle,
  }
}
