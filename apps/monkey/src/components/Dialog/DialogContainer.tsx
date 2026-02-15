import type { DialogContainerExpose, ModalProps } from './types.dialog'
import { defineComponent, ref } from 'vue'
import DialogModal from './DialogModal'
import { useDialogContainerProvide } from './provide'

const DialogContainer = defineComponent({
  name: 'DialogContainer',
  setup(_props, { slots, expose }) {
    const dialogs = ref<ModalProps[]>([])
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
