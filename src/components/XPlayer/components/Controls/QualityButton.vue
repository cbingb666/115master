<template>
  <button
    ref="buttonRef"
    :class="styles.btnText.root"
    data-tip="画质"
    @click="toggleMenu"
  >
    <span>{{ currentQuality }}</span>
  </button>
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
import type { VideoSource } from '../../types'
import { computed, shallowRef } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import Popup from '../Popup/index.vue'

const styles = {
  ...controlStyles,
}

const { source } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

const currentQuality = computed(() => {
  if (!source.current.value)
    return '自动'
  const quality
    = source.current.value.displayQuality || source.current.value.quality
  return typeof quality === 'number' ? `${quality}P` : quality
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
