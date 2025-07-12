<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    data-tip="播放器核心"
    :disabled="source?.current?.value?.type === 'hls' || source?.isSwitching?.value"
    @click="toggleVisible"
  >
    <Icon
      class="transition-transform" :class="[styles.btn.icon, {
        'rotate-90': menuVisible,
        'motion-safe:animate-spin': source?.isSwitching?.value,
      }]" :icon="ICON_PLAYER_CORE"
    />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="[styles.menu.root]">
      <li
        v-for="(type) in [PlayerCoreType.Native, PlayerCoreType.AvPlayer]"
        :key="type"
      >
        <a
          :class="[
            styles.menu.a,
            {
              [styles.menu.active]: playerCore?.type === type,
            },
          ]"
          @click="source.switchPlayerCore(type), menuVisible = false"
        >
          {{ type }}
        </a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { shallowRef } from 'vue'
import { PlayerCoreType } from '../../hooks/playerCore/types'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import { ICON_PLAYER_CORE } from '../../utils/icon'
import Popup from '../Popup/index.vue'

const styles = {
  ...controlStyles,
  btn: {
    ...controlStyles.btn,
    root: [controlStyles.btn.root, 'btn-'],
  },
}

const { source, playerCore } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

function toggleVisible() {
  menuVisible.value = !menuVisible.value
}
</script>
