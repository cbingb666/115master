import { I } from '@/icons'

/**
 * 获取音量图标 Symbol
 * @param volume 音量
 * @param muted 是否静音
 * @returns 音量图标 Symbol
 */
export function getVolumeIcon(volume = 0, muted = false): string {
  if (muted) {
    return I.VOLUME_OFF
  }

  if (volume === 0) {
    return I.VOLUME_MUTE
  }

  if (volume < 50) {
    return I.VOLUME_DOWN
  }

  return I.VOLUME_UP
}
