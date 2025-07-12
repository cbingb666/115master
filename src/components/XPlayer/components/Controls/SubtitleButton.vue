<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    :data-tip="`${subtitles.list.value?.length ? '字幕(C)' : '未找到字幕'}`"
    :disabled="subtitles.loading.value || !subtitles.ready.value || subtitles.list.value?.length === 0"
    @click="toggleMenu"
  >
    <!-- loading -->
    <Icon
      v-if="subtitles.loading.value || !subtitles.ready.value"
      :class="[styles.btn.icon]"
      :icon="ICON_LOADING"
    />
    <!-- found 字幕 -->
    <Icon
      v-else
      :icon="subtitles.current.value ? ICON_SUBTITLES : ICON_SUBTITLES_OFF"
      :class="[styles.btn.icon]"
      :disabled="subtitles.list.value?.length === 0"
    />
  </button>

  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="[styles.menu.root]">
      <li
        v-for="item in menuItems"
        :key="item.id"
      >
        <a
          :class="[
            styles.menu.a,
            {
              [styles.menu.active]: item.value?.url === subtitles.current.value?.url,
            },
          ]"
          :title="item.label"
          @click="handleSubtitleSelect(item.value)"
        >
          <Icon v-if="item.icon" :class="[styles.menu.icon]" :icon="item.icon" />
          <span :class="[styles.menu.label]">{{ item.label }}</span>
          <span :class="[styles.menu.desc]">{{ item.value?.source }}</span>
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import type { Subtitle } from '../../types'
import { Icon } from '@iconify/vue'
import { computed, shallowRef } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import {
  ICON_LOADING,
  ICON_SUBTITLES,
  ICON_SUBTITLES_OFF,
} from '../../utils/icon'
import Popup from '../Popup/index.vue'

const styles = {
  menu: {
    ...controlStyles.menu,
    root: [
      controlStyles.menu.root,
      'max-h-72 max-w-xl overflow-y-auto overflow-x-hidden !flex-nowrap',
    ],
    a: [controlStyles.menu.a, 'flex py-2 flex-wrap w-full'],
    label: [controlStyles.menu.label, 'w-xs flex-1 line-clamp-2'],
    desc: [controlStyles.menu.desc],
  },
  btn: controlStyles.btn,
}

const { subtitles } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

const menuItems = computed(() => {
  return [
    {
      id: -1,
      label: '关闭字幕',
      value: null,
      icon: ICON_SUBTITLES_OFF,
    },
    ...(subtitles.list.value ?? []).map(item => ({
      id: item.url,
      label: item.label,
      value: item,
      icon: undefined,
    })),
  ]
})

function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

function handleSubtitleSelect(subtitle: Subtitle | null) {
  menuVisible.value = false
  subtitles.change(subtitle)
}
</script>
