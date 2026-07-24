import { PlayerCoreType } from '../../hooks/playerCore/types'

interface AudioTrackCore<T> {
  canplay: boolean
  type: PlayerCoreType
  audioStreams?: T[]
  isSupportStream?: (stream: T) => boolean
}

/**
 * 音轨入口只有在存在至少两个可用音轨时才提供切换操作。
 */
export function canSwitchAudioTrack<T>(core: AudioTrackCore<T> | undefined) {
  if (
    !core?.canplay
    || core.type !== PlayerCoreType.AvPlayer
    || !core.audioStreams
    || !core.isSupportStream
  ) {
    return false
  }

  return core.audioStreams.filter(core.isSupportStream).length > 1
}
