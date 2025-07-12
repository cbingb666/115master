// 重置
export const ICON_RESTART = 'material-symbols:restart-alt-rounded'
// 自动缓冲
export const ICON_AUTO_LOAD = 'material-symbols:autorenew-rounded'
// 画中画
export const ICON_PIP = 'material-symbols:pip-rounded'
// 画中画退出
export const ICON_PIP_EXIT = 'material-symbols:pip-exit-rounded'
// 设置
export const ICON_SETTINGS = 'material-symbols:settings-rounded'
// 暂停
export const ICON_PASUE = 'material-symbols:pause-rounded'
// 播放
export const ICON_PLAY = 'material-symbols:play-arrow-rounded'
// 播放器核心
export const ICON_PLAYER_CORE = 'lucide:atom'
// 音频轨道
export const ICON_AUDIO_TRACK = 'material-symbols:audio-file'
// loading
export const ICON_LOADING = 'line-md:loading-loop'
// 快速前进
export const ICON_FAST_FORWARD = 'material-symbols:fast-forward-rounded'
// 快速后退
export const ICON_FAST_REWIND = 'material-symbols:fast-rewind-rounded'
// 旋转左
export const ICON_ROTATE_LEFT = 'material-symbols:rotate-left-rounded'
// 旋转右
export const ICON_ROTATE_RIGHT = 'material-symbols:rotate-right-rounded'
// 旋转正常
export const ICON_ROTATE_NORMAL = 'material-symbols:block'
// 翻转X
export const ICON_FLIP_X = 'gis:flip-h'
// 翻转Y
export const ICON_FLIP_Y = 'gis:flip-v'
// 位置
export const ICON_LOCATION_ON = 'material-symbols:location-on-rounded'
// 长按快进
export const ICON_ROCKET_LAUNCH = 'material-symbols:rocket-launch-rounded'
// 旋转
export const ICON_ROTATE = 'material-symbols:rotate-right-rounded'
// 字幕
export const ICON_SUBTITLES = 'material-symbols:subtitles-rounded'
// 字幕关闭
export const ICON_SUBTITLES_OFF = 'material-symbols:subtitles-off-rounded'
// 计时器
export const ICON_TIMER = 'material-symbols:timer-rounded'
// 音量关闭
export const ICON_VOLUME_OFF = 'material-symbols:volume-off-rounded'
// 音量静音
export const ICON_VOLUME_MUTE = 'material-symbols:volume-mute-rounded'
// 音量降低
export const ICON_VOLUME_DOWN = 'material-symbols:volume-down-rounded'
// 音量升高
export const ICON_VOLUME_UP = 'material-symbols:volume-up-rounded'
// 统计信息
export const ICON_STATISTICS_INFO = 'material-symbols:analytics-outline'
// 快捷键
export const ICON_SHORTCUTS = 'material-symbols:keyboard-outline'
// 关于
export const ICON_ABOUT = 'material-symbols:info-outline'
// 颜色调整
export const ICON_COLOR_ADJUST = 'mdi:color'
// 错误
export const ICON_ERROR = 'material-symbols:error'

/**
 * 获取音量图标 Symbol
 * @param volume 音量
 * @param muted 是否静音
 * @returns 音量图标 Symbol
 */
export function getVolumeIcon(volume = 0, muted = false): string {
  if (muted) {
    return ICON_VOLUME_OFF
  }

  if (volume === 0) {
    return ICON_VOLUME_MUTE
  }

  if (volume < 50) {
    return ICON_VOLUME_DOWN
  }

  return ICON_VOLUME_UP
}
