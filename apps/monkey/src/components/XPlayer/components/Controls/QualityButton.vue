<template>
  <Button
    ref="buttonRef"
    variant="ghost"
    size="sm"
    :class="styles.btnText.root"
    :title="qualityTip"
    @click="toggleMenu"
  >
    <span>{{ currentQuality }}</span>
  </Button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="styles.menu.root">
      <li
        v-for="item in source.list.value"
        :key="item.quality"
      >
        <a

          :class="[
            styles.menu.a,
            {
              [styles.menu.active]: item.quality === source.current.value?.quality,
            },
          ]"
          @click="handleQualityChange(item)"
        >
          {{ getDisplayQuality(item) }}
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import type { VideoSource } from '@/components/XPlayer/types'
import { computed, shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import Button from '../../../Button/Button'

const styles = controlStyles

const { source, shortcuts } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

const NAME = '画质'

const currentQuality = computed(() => {
  if (!source.current.value)
    return '自动'
  const quality
    = source.current.value.displayQuality || source.current.value.quality
  return typeof quality === 'number' ? `${quality}P` : quality
})

const qualityTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('qualityDown')
  return `${NAME}${tip}`
})

function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

function getDisplayQuality(sourceValue: VideoSource) {
  const quality = sourceValue.displayQuality || sourceValue.quality
  return typeof quality === 'number' ? `${quality}P` : quality
}

async function handleQualityChange(sourceValue: VideoSource) {
  menuVisible.value = false
  await source.changeQuality(sourceValue)
}
</script>
