<template>
  <slot />
  <div ref="containerRef" :class="styles.container">
    <Dialog
      v-for="dialog in dialogs"
      :key="dialog.id"
      v-bind="dialog"
      @confirm="handleConfirm(dialog)"
      @cancel="handleCancel(dialog)"
      @close="handleClose(dialog)"
      @opened="handleOpened(dialog)"
    />
  </div>
</template>

<script setup lang="ts">
import type { ModalProps } from '../Modal/types'
import type { DialogContainerExpose, DialogContainerSlots } from './types'
import { ref } from 'vue'
import { clsx } from '@/utils/clsx'
import Dialog from '../Modal/index.vue'
import { useDialogContainerProvide } from './provide'

defineSlots<DialogContainerSlots>()

const dialogs = ref<ModalProps[]>([])

const containerRef = ref()

function addDialog(dialog: ModalProps) {
  dialogs.value.push(dialog)
}

function removeDialog(id: string) {
  const index = dialogs.value.findIndex(d => d.id === id)
  if (index > -1) {
    dialogs.value.splice(index, 1)
  }
}

function clearDialogs() {
  dialogs.value = []
}

function updateDialog(id: string, updates: Partial<ModalProps>) {
  const index = dialogs.value.findIndex(d => d.id === id)
  if (index > -1) {
    dialogs.value[index] = { ...dialogs.value[index], ...updates }
  }
}

function handleConfirm(dialog: ModalProps) {
  dialog.confirmCallback?.()
  const index = dialogs.value.findIndex(d => d.id === dialog.id)
  if (index > -1) {
    dialogs.value[index].visible = false
    setTimeout(() => {
      removeDialog(dialog.id)
    }, 300)
  }
}

function handleCancel(dialog: ModalProps) {
  dialog.cancelCallback?.()
  const index = dialogs.value.findIndex(d => d.id === dialog.id)
  if (index > -1) {
    dialogs.value[index].visible = false
    setTimeout(() => {
      removeDialog(dialog.id)
    }, 300)
  }
}

function handleClose(dialog: ModalProps) {
  const index = dialogs.value.findIndex(d => d.id === dialog.id)
  if (index > -1) {
    dialogs.value[index].visible = false
    setTimeout(() => {
      removeDialog(dialog.id)
    }, 300)
  }
}

function handleOpened(dialog: ModalProps) {
  dialog.openedCallback?.()
}

const expose = {
  addDialog,
  removeDialog,
  clearDialogs,
  updateDialog,
}

defineExpose<DialogContainerExpose>(expose)

useDialogContainerProvide(expose)

const styles = clsx({
  container: [
    'fixed',
    'inset-0',
    'pointer-events-none',
    'z-[9999]',
  ],
})
</script>

<style scoped>
.container :deep(.modal) {
  pointer-events: auto;
}
</style>
