import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import type { IconValue } from '@/icons'

export interface FileAction {
  label: string
  icon: IconValue
  iconColor?: string
  onAction: (ctx: PlayerContext) => void | Promise<void>
}

export interface FileActionMenuProps {
  actions: FileAction[]
  ctx: PlayerContext
}
