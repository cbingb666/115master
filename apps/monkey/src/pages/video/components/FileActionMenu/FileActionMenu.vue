<template>
  <div :class="styles.container">
    <ul :class="styles.root">
      <li
        v-for="(action, index) in actions"
        :key="index"
        :class="styles.item"
        @click="() => action.onAction(ctx)"
      >
        <button :class="styles.button">
          <Icon :name="action.icon" :class="[styles.icon, action.iconColor]" />
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { FileActionMenuProps } from './FileActionMenu.types'
import { Icon } from '@/icons'
import { clsx } from '@/utils/clsx'

const props = defineProps<FileActionMenuProps>()

const { ctx } = props

const styles = clsx({
  container: [
    'flex items-center',
    'px-1',
    'rounded-full',
    'bg-base-100/50',
    'relative',
    'app-glass-border',
  ],
  root: 'flex items-center',
  item: 'flex items-center',
  button: [
    'btn btn-link btn-circle',
    'text-base-content disabled:text-base-content/30',
    'hover:text-base-content/80',
  ],
  icon: 'size-7',
})
</script>

<style module>
</style>
