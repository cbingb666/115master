<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    :disabled="!playerCore?.canplay || playerCore?.type !== PlayerCoreType.AvPlayer"
    data-tip="音频轨道"
    @click="toggleVisible"
  >
    <Icon :class="[styles.btn.icon]" :icon="ICON_AUDIO_TRACK" />
  </button>

  <Popup
    v-if="playerCore?.type === PlayerCoreType.AvPlayer"
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="[styles.menu.root]">
      <li
        v-for="(stream) in playerCore.audioStreams"
        :key="stream.id"
      >
        <a
          :class="[styles.menu.a, {
            [styles.menu.active]: playerCore.audioStreamId === stream.id,
          }]"
          :disabled="!playerCore.isSupportStream(stream)"
          @click="playerCore.setAudioStream(stream.id)"
        >
          <span :class="[styles.menu.label]">
            {{ stream.id }}. {{ stream.metadata.title ?? 'Untitled' }}
          </span>
          <span :class="[styles.menu.desc]">
            {{ stream.metadata.language }}
          </span>
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
import { ICON_AUDIO_TRACK } from '../../utils/icon'
import Popup from '../Popup/index.vue'

const styles = {
  ...controlStyles,
}

const { playerCore } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

function toggleVisible() {
  menuVisible.value = !menuVisible.value
}
</script>
