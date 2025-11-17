<template>
  <div v-if="subtitles.current.value" :class="styles.container">
    <div
      v-if="currentSubtitle"
      :class="styles.content"
      :style="{
        fontSize,
        transform: `translate(-50%, calc(0px - ${safeAreaBottom}))`,
      }"
    >
      {{ cleanedText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Subtitle } from '../../types'
import { useElementBounding } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

const styles = {
  container: 'absolute inset-0',
  content: [
    'absolute left-1/2 bottom-[3%] max-w-[80%] mx-auto px-1',
    'bg-black/75 whitespace-pre-wrap text-white text-center',
    'transition-transform duration-200 ease-in-out',
  ],
}

const { subtitles, cssVar, refs, playerCore } = usePlayerContext()
/** 安全区域底部 */
const safeAreaBottom = computed(() => cssVar?.safeAreaBottom.value)
/** 当前字幕 */
const current = computed(() => subtitles.current.value)
/** 当前字幕文本 */
const text = shallowRef<string | null>(null)
/** 视频元素的边界 */
const playerElementBounding = useElementBounding(refs.playerElementRef)
/** 字幕字体大小 */
const fontSize = computed(
  () => `${playerElementBounding.height.value * 0.044}px`,
)
/**
 * 解析后的字幕
 */
const subtitleParsed = shallowRef<
  {
    start: string
    end: string
    text: string
    st: number
    et: number
  }[]
>([])
/**
 * 当前字幕
 */
const currentSubtitle = computed(() => {
  return subtitleParsed.value.find((subtitle) => {
    if (!playerCore.value) {
      return false
    }
    return (
      subtitle.st <= playerCore.value?.currentTime
      && subtitle.et >= playerCore.value?.currentTime
    )
  })
})
/** 清理后的字幕文本 */
const cleanedText = computed(() => {
  return currentSubtitle.value?.text.replace(/<[^>]*>?/g, '')
})

/**
 * 将时间转换为秒
 * @param time 时间字符串, 格式为 HH:MM:SS.MS
 * @returns 秒
 */
function timeToSeconds(time: string) {
  const [hours, minutes, seconds] = time.split(':').map(Number)
  const [secondsPart, msPart] = seconds.toString().split('.')
  return (
    hours * 3600
    + minutes * 60
    + parseInt(secondsPart)
    + parseInt(msPart) / 1000
  )
}

/**
 * 解析字幕
 * @param text 字幕文本
 */
function parseSubtitle(text: string) {
  const lines = text.split(/\n\n/).filter(line => line.trim() !== '')
  const subtitles = []
  for (const line of lines) {
    if (/WEBVTT/.test(line))
      continue

    const linesSplit = line.split(/\n/)
    /** 首行视为时间，其余为文本 */
    const time = linesSplit.shift() ?? ''
    const text = linesSplit.join('\n') ?? ''

    const [start, end] = time.split('-->')
    const st = timeToSeconds(start)
    const et = timeToSeconds(end)
    subtitles.push({ start, end, text, st, et })
  }
  subtitleParsed.value = subtitles
}

/**
 * 加载字幕
 * @param subtitle 字幕
 */
async function loadSubtitle(subtitle: Subtitle | null) {
  if (!subtitle) {
    text.value = null
    return
  }
  const response = await fetch(subtitle.url)
  const blob = await response.blob()
  text.value = await blob.text()
  parseSubtitle(text.value)
}

watch(current, () => {
  loadSubtitle(current.value)
})
</script>
