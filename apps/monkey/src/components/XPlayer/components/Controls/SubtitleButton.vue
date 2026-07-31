<template>
  <Button
    ref="buttonRef"
    variant="ghost"
    shape="circle"
    :title="subtitleTip"
    :disabled="subtitles.loading.value || !subtitles.ready.value || subtitles.list.value?.length === 0"
    @click="toggleMenu"
  >
    <!-- loading -->
    <Icon
      v-if="subtitles.loading.value || !subtitles.ready.value"
      :class="styles.btn.icon"
      :name="I.LOADING"
    />
    <!-- found 字幕 -->
    <Icon
      v-else
      :name="subtitles.current.value ? I.SUBTITLES : I.SUBTITLES_OFF"
      :class="styles.btn.icon"
      :disabled="subtitles.list.value?.length === 0"
    />
  </Button>

  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul v-if="subtitles.hasSubtitles.value" :class="styles.menu.root">
      <li
        v-for="item in menuItems"
        :key="item.id"
      >
        <a
          :class="[
            styles.menu.a,
            {
              [styles.menu.active]: item.value?.id === subtitles.current.value?.id,
            },
          ]"
          :title="item.label"
          @click="handleSubtitleSelect(item.value)"
        >
          <Icon v-if="item.icon" :class="styles.menu.icon" :name="item.icon" />
          <template v-if="item.id !== -1">
            <SubtitleDisplay
              :label="item.label"
              :format="item.raw?.format"
              :source="item.value?.source"
              :subtitle-index="item.index"
              :total="subtitles.total.value"
              :show-actions="true"
              :active="item.value?.id === subtitles.current.value?.id"
              @view="viewSubtitle(item.value!)"
              @download="downloadSubtitle(item.value!)"
            />
          </template>
          <template v-else>
            <span :class="styles.menu.label">{{ item.label }}</span>
          </template>
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import type { Subtitle } from '@/components/XPlayer/types'
import { Button } from '@115master/ui'
import { computed, shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import SubtitleDisplay from '@/components/XPlayer/components/SubtitleDisplay.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  menu: {
    ...controlStyles.menu,
    root: [
      controlStyles.menu.root,
      'max-h-80 max-w-xl !flex-nowrap',
      'overflow-x-hidden overflow-y-auto',
      '[&::-webkit-scrollbar-track]:my-6',
    ],
    a: [
      controlStyles.menu.a,
      'flex items-center',
      'w-full gap-2',
      'px-3 py-2',
      'hover:bg-base-content/10',
      'transition-colors',
    ],
    label: 'line-clamp-1 text-sm font-medium',
  },
  btn: controlStyles.btn,
})

const { subtitles, shortcuts, logger } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

const NAME = '字幕'

const subtitleTip = computed(() => {
  if (!subtitles.list.value?.length)
    return '未找到字幕'

  const tip = shortcuts.getShortcutsTip('toggleSubtitle')
  return `${NAME}${tip}`
})

const menuItems = computed(() => {
  return [
    {
      id: -1,
      label: '关闭字幕',
      value: null,
      icon: I.SUBTITLES_OFF,
      raw: undefined,
      index: null,
    },
    ...(subtitles.list.value ?? []).map((item, idx) => ({
      id: item.url,
      label: item.label,
      value: item,
      icon: undefined,
      raw: item,
      index: idx + 1,
    })),
  ]
})

/**
 * 创建字幕文件BlobUrl
 */
async function createSubtitleBlobUrl(subtitle: Subtitle): Promise<string> {
  const blob = subtitle.raw
  if (!blob) {
    throw new Error('无法创建字幕文件: 原始字幕数据不存在')
  }
  const blobRe = new Blob([blob], { type: 'text/plain;charset=utf-8' })
  return URL.createObjectURL(blobRe)
}

/**
 * 下载字幕
 */
async function downloadSubtitle(subtitle: Subtitle) {
  const blobUrl = await createSubtitleBlobUrl(subtitle)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `${subtitle.label}.${subtitle.format}`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}

/**
 * 查看字幕
 */
async function viewSubtitle(subtitle: Subtitle) {
  const blobUrl = await createSubtitleBlobUrl(subtitle)

  if (!blobUrl) {
    logger.warn('查看字幕失败: 无法创建字幕文件')
    return null
  }

  const newWin = window.open(blobUrl, '_blank')

  if (!newWin) {
    window.location.href = blobUrl
  }
}

function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

function handleSubtitleSelect(subtitle: Subtitle | null) {
  menuVisible.value = false
  subtitles.change(subtitle)
}
</script>
