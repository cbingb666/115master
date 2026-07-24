<template>
  <Button
    ref="buttonRef"
    variant="ghost"
    shape="circle"
    :disabled="!canSwitch"
    aria-label="音频轨道"
    title="音频轨道"
    @click="toggleVisible"
  >
    <Icon :class="styles.btn.icon" :name="I.AUDIO_TRACK" />
  </Button>

  <Popup
    v-if="playerCore?.type === PlayerCoreType.AvPlayer"
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="styles.menu.root">
      <li
        v-for="(stream) in playerCore.audioStreams"
        :key="stream.id"
      >
        <Button
          variant="ghost"
          size="sm"
          block
          :class="[styles.menu.a, {
            [styles.menu.active]: playerCore.audioStreamId === stream.id,
          }]"
          :disabled="!playerCore.isSupportStream(stream)"
          @click="selectTrack(stream.id)"
        >
          <span :class="styles.menu.label">
            {{ stream.id }}. {{ stream.metadata.title ?? 'Untitled' }}
          </span>
          <span :class="styles.menu.desc">
            {{ stream.metadata.language }}
          </span>
        </Button>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { PlayerCoreType } from '@/components/XPlayer/hooks/playerCore/types'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import Button from '../../../Button/Button'
import { canSwitchAudioTrack } from './audioTrack'

const styles = controlStyles

const { playerCore } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()
const canSwitch = computed(() => canSwitchAudioTrack(playerCore.value))

function toggleVisible() {
  if (!canSwitch.value) {
    return
  }
  menuVisible.value = !menuVisible.value
}

function selectTrack(id: number) {
  const core = playerCore.value
  if (core?.type !== PlayerCoreType.AvPlayer) {
    return
  }

  const stream = core.audioStreams.find(stream => stream.id === id)
  if (!stream || !core.isSupportStream(stream)) {
    return
  }

  void core.setAudioStream(id)
}
</script>
