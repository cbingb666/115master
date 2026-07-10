<!-- 已弃用,仅限开发调试使用 -->
<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    title="播放器核心"
    :disabled="source?.current?.value?.type === 'hls' || source?.isSwitching?.value"
    @click="toggleVisible"
  >
    <Icon
      class="transition-transform" :class="[styles.btn.icon, {
        'rotate-90': menuVisible,
        'motion-safe:animate-spin': source?.isSwitching?.value,
      }]" :name="I.PLAYER_CORE"
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
import { shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { PlayerCoreType } from '@/components/XPlayer/hooks/playerCore/types'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  ...controlStyles,
  btn: {
    ...controlStyles.btn,
    root: [controlStyles.btn.root, 'btn-'],
  },
})

const { source, playerCore } = usePlayerContext()
const menuVisible = shallowRef(false)
const buttonRef = shallowRef<HTMLElement>()

function toggleVisible() {
  menuVisible.value = !menuVisible.value
}
</script>
