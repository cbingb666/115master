<template>
  <PlayerControlSurface>
    <ul :class="styles.root">
      <li
        v-for="(action, index) in actions"
        :key="index"
        :class="styles.item"
        @click="() => action.onAction(ctx)"
      >
        <Button variant="ghost" shape="circle" :class="styles.button">
          <Icon :name="action.icon" :class="[styles.icon, action.iconColor]" />
        </Button>
      </li>
    </ul>
  </PlayerControlSurface>
</template>

<script setup lang="ts">
import type { FileActionMenuProps } from './FileActionMenu.types'
import { Button } from '@115master/ui'
import PlayerControlSurface from '@/components/XPlayer/components/Controls/PlayerControlSurface'
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = defineProps<FileActionMenuProps>()

const { ctx } = props

const styles = clsx({
  root: 'flex items-center',
  item: 'flex items-center',
  button: 'text-base-content',
  icon: 'size-7',
})
</script>

<style module>
</style>
