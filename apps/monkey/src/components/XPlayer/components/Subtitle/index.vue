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
import type { Subtitle } from '@/components/XPlayer/types'
import { useElementBounding } from '@vueuse/core'
import { computed, shallowRef, watch } from 'vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'
import { convertToUtf8Blob } from '@/utils/encoding'
import { convertSrtToVtt } from '@/utils/subtitle/subtitleTool'

const styles = clsx({
  container: 'absolute inset-0',
  content: [
    'absolute bottom-[3%] left-1/2 mx-auto max-w-[80%] px-6',
    'bg-black/60 text-center whitespace-pre-wrap text-white',
    'transition-transform duration-200 ease-in-out',
    'rounded-xl',
  ],
})

const { subtitles, cssVar, refs, playerCore, logger } = usePlayerContext()
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
  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number)
  const [secondsPart = '0', msPart = '0'] = seconds.toString().split('.')

  return (
    hours * 3600
    + minutes * 60
    + parseInt(secondsPart)
    + parseInt(msPart) / 1000
  )
}

/**
 * 解析字幕VTT格式
 * @param text 字幕文本
 */
function parseSubtitleVTT(text: string) {
  const blocks = text.split(/\n\n/).filter(block => block.trim() !== '')
  const subtitles = []
  for (const block of blocks) {
    if (/WEBVTT/.test(block))
      continue

    const lines = block.split(/\n/)
    /** 首行视为时间，其余为文本 */
    const time = lines.shift() ?? ''
    const text = lines.join('\n') ?? ''

    const [start, end] = time.split('-->')
    const st = timeToSeconds(start.trim())
    const et = timeToSeconds(end.trim())
    subtitles.push({ start, end, text, st, et })
  }
  subtitleParsed.value = subtitles
}

/**
 * 解析字幕
 * @param text 字幕文本
 */
function parseSubtitle(text: string, format: Subtitle['format']) {
  let formatedText: string | undefined
  switch (format) {
    case 'srt':
      formatedText = convertSrtToVtt(text)
      break
    case 'vtt':
      formatedText = text
      break
    default:
      logger.warn('不支持的字幕格式:', format)
      return
  }
  parseSubtitleVTT(formatedText)
}

/**
 * 从URL加载字幕并转换为Blob
 * @param url 字幕URL
 */
async function fetchSubtitleBlob(url: string) {
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  return convertToUtf8Blob(arrayBuffer)
}

async function processRawSubtitle(raw: Blob, format: Subtitle['format']) {
  const text = await raw.text()
  parseSubtitle(text, format)
}

async function processUrlSubtitle(url: string, format: Subtitle['format']) {
  const blob = await fetchSubtitleBlob(url)
  parseSubtitle(await blob.text(), format)
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
  try {
    if (subtitle.raw) {
      processRawSubtitle(subtitle.raw, subtitle.format)
    }
    else if (subtitle.url) {
      processUrlSubtitle(subtitle.url, subtitle.format)
    }
  }
  catch (error) {
    logger.error('加载字幕失败:', error)
    text.value = null
  }
}

watch(current, () => {
  loadSubtitle(current.value)
})
</script>
