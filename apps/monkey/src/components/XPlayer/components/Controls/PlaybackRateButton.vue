<template>
  <Button
    ref="buttonRef"
    variant="ghost"
    size="sm"
    :class="styles.btnText.root"
    :disabled="!playerCore?.canplay"
    :title="playbackRateTip"
    @click="toggleSpeedMenu"
  >
    <Icon v-if="playbackRate.current.value === 1" :class="styles.btn.icon" :name="I.PLAYBACK_RATE" />
    <span v-else>{{ buttonText }}</span>
  </Button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
  >
    <ul :class="styles.menu.root">
      <li
        v-for="rate in rateOptions"
        :key="rate"
        @click="handleSpeedChange(rate)"
      >
        <a
          :class="[styles.menu.a, {
            [styles.menu.active]: playbackRate.current.value === rate,
          }]"
        >{{ rate }}</a>
      </li>
    </ul>
  </Popup>
</template>

<script setup lang="ts">
import { Button } from '@115master/ui'
import { computed, ref, shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'

const styles = controlStyles

const NAME = '倍速'

const { playbackRate, playerCore, shortcuts } = usePlayerContext()
const rateOptions = computed(() =>
  [...playbackRate.rateOptions.value].reverse(),
)
const menuVisible = shallowRef(false)
const buttonRef = ref<HTMLElement>()
const buttonText = computed(() => {
  return `${playbackRate.current.value}X`
})

const playbackRateTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('playbackRateUp', 'playbackRateDown')
  return `${NAME}${tip}`
})

/** 切换菜单显示 */
function toggleSpeedMenu() {
  menuVisible.value = !menuVisible.value
}

/** 处理倍速变化 */
function handleSpeedChange(rate: number) {
  playbackRate.set(rate)
  menuVisible.value = false
}
</script>
