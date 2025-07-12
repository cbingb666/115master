<template>
  <div
    ref="maskRef"
    :class="styles.mask"
    @click.self="handleClick"
    @dblclick.self="handleDoubleClick"
    @contextmenu.prevent="contextMenu.handleContextMenu"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'

const styles = {
  mask: 'relative flex-1',
}

const {
  fullscreen,
  playerCore: player,
  popupManager,
  contextMenu,
} = usePlayerContext()

const maskRef = shallowRef<HTMLDivElement>()

/** 处理单击事件 */
function handleClick() {
  player.value?.togglePlay()
}

/** 处理双击事件 */
function handleDoubleClick() {
  fullscreen.toggleFullscreen()
}

onMounted(() => {
  popupManager?.addDisabledBubblingElement(maskRef.value!)
})

onUnmounted(() => {
  popupManager?.removeDisabledBubblingElement(maskRef.value!)
})
</script>
