import type { ModalProps } from '../Modal/types'

export interface DialogContainerSlots {
  default?: () => void
}

export interface DialogContainerExpose {
  addDialog: (dialog: ModalProps) => void
  removeDialog: (id: string) => void
  clearDialogs: () => void
  updateDialog: (id: string, updates: Partial<ModalProps>) => void
}

export interface DialogContainerContext extends DialogContainerExpose {}
