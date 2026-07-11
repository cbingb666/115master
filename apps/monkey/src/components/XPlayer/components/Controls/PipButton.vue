<template>
  <button
    :class="[styles.btn.root]"
    :title="pipTip" :disabled="playerCore?.type === PlayerCoreType.AvPlayer" @click="pictureInPicture.toggle"
  >
    <Icon v-if="pictureInPicture.isPip.value" :name="I.PIP_EXIT" :class="[styles.btn.icon]" />
    <Icon v-else :name="I.PIP" :class="[styles.btn.icon]" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { PlayerCoreType } from '@/components/XPlayer/hooks/playerCore/types'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  ...controlStyles,
})

const { pictureInPicture, playerCore, shortcuts } = usePlayerContext()

const NAME = '画中画'

const pipTip = computed(() => {
  const tip = shortcuts.getShortcutsTip('togglePictureInPicture')
  return `${NAME}${tip}`
})
</script>
