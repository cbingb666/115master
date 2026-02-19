import type { DialogContainerExpose, ModalProps, ModalPropsInternal } from './types.dialog'
import { useMagicKeys } from '@vueuse/core'
import { defineComponent, ref, watch } from 'vue'
import DialogModal from './DialogModal'
import { useDialogContainerProvide } from './provide'

const DialogContainer = defineComponent({
  name: 'DialogContainer',
  setup(_props, { slots, expose }) {
    const dialogs = ref<ModalPropsInternal[]>([])
    const containerRef = ref<HTMLDivElement>()

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

    async function handleConfirm(dialog: ModalPropsInternal) {
      if (await dialog.confirmCallback?.() === false)
        return
      dialog._historyDispose?.()
      const index = dialogs.value.findIndex(d => d.id === dialog.id)
      if (index > -1) {
        dialogs.value[index].visible = false
        setTimeout(() => {
          removeDialog(dialog.id)
        }, 300)
      }
    }

    function handleCancel(dialog: ModalPropsInternal) {
      dialog._historyDispose?.()
      dialog.cancelCallback?.()
      const index = dialogs.value.findIndex(d => d.id === dialog.id)
      if (index > -1) {
        dialogs.value[index].visible = false
        setTimeout(() => {
          removeDialog(dialog.id)
        }, 300)
      }
    }

    function handleClose(dialog: ModalPropsInternal) {
      dialog._historyDispose?.()
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

    const keys = useMagicKeys()
    watch(keys.Escape, (value) => {
      if (!value)
        return
      const visible = dialogs.value.filter(d => d.visible)
      if (visible.length === 0)
        return
      handleClose(visible[visible.length - 1])
    })

    const exposeObj: DialogContainerExpose = {
      addDialog,
      removeDialog,
      clearDialogs,
      updateDialog,
    }

    expose(exposeObj)
    useDialogContainerProvide(exposeObj)

    return () => (
      <>
        {slots.default?.()}
        <div
          ref={containerRef}
          class="pointer-events-none fixed inset-0 z-9999"
        >
          {dialogs.value.map(dialog => (
            <DialogModal
              key={dialog.id}
              {...dialog}
              onConfirm={() => handleConfirm(dialog)}
              onCancel={() => handleCancel(dialog)}
              onClose={() => handleClose(dialog)}
              onOpened={() => handleOpened(dialog)}
            />
          ))}
        </div>
      </>
    )
  },
})

export default DialogContainer
