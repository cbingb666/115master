import { useStorage } from '@vueuse/core'

/**
 * 用户偏好设置
 */
export function usePreferences() {
  const preferences = useStorage(
    'x-player-preferences',
    {
      // 音量
      volume: 100,
      // 静音
      muted: true,
      // 播放速率
      playbackRate: 1,
      // 显示播放列表
      showPlaylist: false,
      // 自动加载缩略图
      autoLoadThumbnails: true,
      // 禁用HDR
      disabledHDR: false,
      // 缩略图采样间隔
      thumbnailsSamplingInterval: 60,
      // 自动播放
      autoPlay: true,
    },
    undefined,
    {
      listenToStorageChanges: false,
    },
  )

  return preferences
}
