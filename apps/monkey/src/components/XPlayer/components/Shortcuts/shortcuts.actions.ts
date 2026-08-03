import type {
  Action,
  ActionMap,
} from './shortcuts.types'
import type { PlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { ENHANCE_CONFIGS } from '@/components/XPlayer/hooks/useVideoEnhance'
import {
  ACTION_GROUPS,
  ENHANCE_OFFSET,
  VOLUME_OFFSET,
} from './shortcuts.const'
import { withGroup } from './shortcuts.utils'

/** 获取快进秒数 (从偏好设置读取) */
function getSeekSeconds(ctx: PlayerContext): number {
  const seconds = ctx.rootPropsVm.seekSeconds.value
  // 限制在 1-300 范围内
  return Math.max(1, Math.min(300, seconds))
}

/** 获取高速快进秒数 (从偏好设置读取) */
function getHighSeekSeconds(ctx: PlayerContext): number {
  const seconds = ctx.rootPropsVm.highSpeedSeekSeconds.value
  // 限制在 1-300 范围内
  return Math.max(1, Math.min(300, seconds))
}

/** 播放/进度动作 */
const PLAY_ACTION_MAP = withGroup({
  /**
   * 播放/暂停
   */
  togglePlay: {
    name: '播放/暂停',
    keydown: (ctx) => {
      ctx.playerCore.value?.togglePlay()
    },
  },

  /**
   * 快进
   */
  fastForward: {
    name: '快进',
    allowRepeat: true,
    keydown: async (ctx, event) => {
      if (event.repeat) {
        if (!ctx.playbackRate?.fastForward.value) {
          ctx.playbackRate?.startLongPressFastForward()
        }
        ctx.hud?.showLongPressFastForward()
        return
      }
      const value = getSeekSeconds(ctx)
      ctx.playerCore.value?.skip(value)
      ctx.hud?.showFastJumpHud(value)
    },
    keyup: async (ctx) => {
      if (ctx.playbackRate?.fastForward.value) {
        ctx.playbackRate?.stopLongPressFastForward()
        ctx.hud?.clear()
      }
    },
  },

  /**
   * 后退
   */
  fastBackward: {
    name: '后退',
    allowRepeat: true,
    keydown: (ctx) => {
      const value = -getSeekSeconds(ctx)
      ctx.playerCore.value?.skip(value)
      ctx.hud?.showFastJumpHud(value)
    },
  },

  /**
   * 高速快进
   */
  highFastForward: {
    name: '高速快进',
    allowRepeat: true,
    keydown: (ctx) => {
      const value = getHighSeekSeconds(ctx)
      ctx.playerCore.value?.skip(value)
      ctx.hud?.showFastJumpHud(value)
    },
  },

  /**
   * 高速后退
   */
  highFastBackward: {
    name: '高速后退',
    allowRepeat: true,
    keydown: (ctx) => {
      const value = -getHighSeekSeconds(ctx)
      ctx.playerCore.value?.skip(value)
      ctx.hud?.showFastJumpHud(value)
    },
  },

  /**
   * 百分比快进
   */
  percentageFastForward: {
    name: '百分比快进',
    allowRepeat: true,
    keydown: (ctx) => {
      const percentage = ctx.rootPropsVm.percentageSeek.value
      const duration = ctx.playerCore.value?.duration || 0
      const seconds = (duration * percentage) / 100
      const finalSeconds = seconds > 0 ? seconds : 1
      console.log('[percentageFastForward]', { percentage, duration, seconds, finalSeconds })
      ctx.playerCore.value?.skip(finalSeconds)
      ctx.hud?.showFastJumpHud(percentage, true)
    },
  },

  /**
   * 百分比后退
   */
  percentageFastBackward: {
    name: '百分比后退',
    allowRepeat: true,
    keydown: (ctx) => {
      const percentage = ctx.rootPropsVm.percentageSeek.value
      const duration = ctx.playerCore.value?.duration || 0
      const seconds = (duration * percentage) / 100
      const finalSeconds = seconds > 0 ? seconds : 1
      console.log('[percentageFastBackward]', { percentage, duration, seconds, finalSeconds })
      ctx.playerCore.value?.skip(-finalSeconds)
      ctx.hud?.showFastJumpHud(-percentage, true)
    },
  },

  /**
   * 跳转
   */
  progress: {
    name: '0-90% 跳转',
    maxShortcuts: 10,
    keydown: (ctx, _event, action) => {
      const index = action.index
      const percentage = index / 10
      ctx.playerCore.value?.skip(percentage, true)

      if (ctx.hud) {
        ctx.hud.showProgressJump(index)
      }
    },
  },

  /**
   * 倍速增大
   */
  playbackRateUp: {
    name: '倍速 +',
    allowRepeat: true,
    keydown: async (ctx) => {
      ctx.playbackRate?.up()
      ctx.hud?.showPlaybackRate()
    },
  },

  /**
   * 倍速减小
   */
  playbackRateDown: {
    name: '倍速 -',
    allowRepeat: true,
    keydown: (ctx, event) => {
      if (event.repeat) {
        ctx.playbackRate?.downWithLowerLimit()
        ctx.hud?.showPlaybackRate()
      }
      else {
        ctx.playbackRate?.down()
        ctx.hud?.showPlaybackRate()
      }
    },
  },
} satisfies ActionMap, ACTION_GROUPS.PLAY)

/** 窗口动作 */
const WINDOW_ACTION_MAP = withGroup({
  /**
   * 切换全屏
   */
  toggleFullscreen: {
    name: '切换全屏',
    allowInModal: true,
    keydown: (ctx) => {
      ctx.fullscreen?.toggleFullscreen()
    },
  },

  /**
   * 切换画中画
   */
  togglePictureInPicture: {
    name: '切换画中画',
    keydown: (ctx) => {
      ctx.pictureInPicture?.toggle()
    },
  },
} satisfies ActionMap, ACTION_GROUPS.WINDOW)

/** 声音动作 */
const SOUND_ACTION_MAP = withGroup({
  /**
   * 音量增大
   */
  volumeUp: {
    name: '音量 +',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.adjustVolume(VOLUME_OFFSET)
      ctx.hud?.showVolume()
    },
  },

  /**
   * 音量减小
   */
  volumeDown: {
    name: '音量 -',
    allowRepeat: true,
    keydown: (ctx) => {
      ctx.playerCore.value?.adjustVolume(-VOLUME_OFFSET)
      ctx.hud?.showVolume()
    },
  },

  /**
   * 静音
   */
  toggleMute: {
    name: '静音',
    keydown: (ctx) => {
      if (ctx.playerCore.value?.isSuspended) {
        ctx.playerCore.value?.resumeSuspended()
        ctx.hud?.showResumeSuspended()
        return
      }
      ctx.playerCore.value?.toggleMute()
      ctx.hud?.showMute()
    },
  },
}, ACTION_GROUPS.SOUND)

const SUBTITLE_ACTION_MAP = withGroup({
  /**
   * 字幕
   */
  toggleSubtitle: {
    name: '字幕',
    keydown: (ctx) => {
      if (ctx.subtitles?.loading.value || !ctx.subtitles?.ready.value) {
        return
      }
      ctx.subtitles?.toggleEnabled()
    },
  },

  /**
   * 下一个字幕
   */
  nextSubtitle: {
    name: '下一个字幕',
    keydown: (ctx) => {
      if (ctx.subtitles?.loading.value || !ctx.subtitles?.ready.value) {
        return
      }
      ctx.subtitles?.next()
    },
  },

  /**
   * 上一个字幕
   */
  prevSubtitle: {
    name: '上一个字幕',
    keydown: (ctx) => {
      if (ctx.subtitles?.loading.value || !ctx.subtitles?.ready.value) {
        return
      }
      ctx.subtitles?.prev()
    },
  },
} satisfies ActionMap, ACTION_GROUPS.SUBTITLE)

/** 播放列表/画质动作 */
const EPISODE_ACTION_MAP = withGroup({
  /**
   * 播放列表
   */
  toggleShowSider: {
    name: '播放列表',
    allowInModal: true,
    keydown: (ctx) => {
      ctx.fullscreen?.toggleShowSider()
    },
  },
  /**
   * 播放上一集
   */
  playPrevious: {
    name: '播放上一集',
    keydown: (ctx) => {
      ctx.rootEmit('playPrevious', ctx)
    },
  },
  /**
   * 播放下一集
   */
  playNext: {
    name: '播放下一集',
    keydown: (ctx) => {
      ctx.rootEmit('playNext', ctx)
    },
  },

  /**
   * 画质降低
   */
  qualityDown: {
    name: '切换画质',
    keydown: (ctx) => {
      ctx.source?.cycleQualityDown()
      ctx.hud?.show({
        title: '画质 ',
        value: ctx.source?.current.value?.displayQuality
          || ctx.source?.current.value?.quality,
      })
    },
  },
} satisfies ActionMap, ACTION_GROUPS.EPISODE)

/** 画面变换动作 */
const TRANSFORM_ACTION_MAP = withGroup({
  /**
   * 向左旋转
   */
  rotateLeft: {
    name: '向左旋转',
    keydown: (ctx) => {
      ctx.transform?.left()
    },
  },

  /**
   * 向右旋转
   */
  rotateRight: {
    name: '向右旋转',
    keydown: (ctx) => {
      ctx.transform?.right()
    },
  },

  /**
   * 重置旋转
   */
  resetRotation: {
    name: '重置旋转',
    keydown: (ctx) => {
      ctx.transform?.normal()
    },
  },

  /**
   * 水平翻转
   */
  toggleFlipX: {
    name: '水平翻转',
    keydown: (ctx) => {
      ctx.transform?.toggleFlipX()
    },
  },

  /**
   * 垂直翻转
   */
  toggleFlipY: {
    name: '垂直翻转',
    keydown: (ctx) => {
      ctx.transform?.toggleFlipY()
    },
  },
} satisfies ActionMap, ACTION_GROUPS.TRANSFORM)

/** 基础颜色增强动作 */
type _BaseEnhanceActionMap = Record<
  (
    | `${keyof typeof ENHANCE_CONFIGS}Up`
    | `${keyof typeof ENHANCE_CONFIGS}Down`
  ),
  Action
>
const _BASE_ENHANCE_COLOR_ACTION_MAP = Object.entries(ENHANCE_CONFIGS)
  .reduce<_BaseEnhanceActionMap>
  ((acc, [key, config]) => {
    const { name } = config
    const paramKey = key as keyof typeof ENHANCE_CONFIGS
    const showHud = (ctx: PlayerContext) => {
      ctx.hud?.show({
        title: name,
        value: ctx.videoEnhance.enhanceParams.values[paramKey].value,
      })
    }
    return {
      ...acc,
      [`${paramKey}Up`]: {
        name: `${name} +`,
        allowRepeat: true,
        keydown: (ctx) => {
          ctx.videoEnhance.enhanceParams.values[paramKey].value += ENHANCE_OFFSET
          showHud(ctx)
        },
      } satisfies Action,
      [`${paramKey}Down`]: {
        name: `${name} -`,
        allowRepeat: true,
        keydown: (ctx) => {
          ctx.videoEnhance.enhanceParams.values[paramKey].value -= ENHANCE_OFFSET
          showHud(ctx)
        },
      } satisfies Action,
    }
  }, {} as _BaseEnhanceActionMap)

/** 颜色增强动作 */
const ENHANCE_COLOR_ACTION_MAP = withGroup({
  ..._BASE_ENHANCE_COLOR_ACTION_MAP,

  /** 重置视频色彩 */
  resetVideoEnhance: {
    name: '重置视频色彩',
    keydown: (ctx) => {
      ctx.videoEnhance.enhanceParams.resetAll()
      ctx.hud?.show({
        title: '重置视频色彩',
      })
    },
  },

  /**
   * 禁用HDR
   */
  hdr: {
    name: '禁用HDR',
    keydown: (ctx) => {
      ctx.videoEnhance.disabledHDR.value
        = !ctx.videoEnhance.disabledHDR.value
    },
  },
} satisfies ActionMap, ACTION_GROUPS.ENHANCE)

/** 其他动作 */
const OTHER_ACTION_MAP = withGroup({
  /**
   * 快捷键设置
   */
  shortcuts: {
    name: '快捷键设置',
    keydown: (ctx) => {
      ctx.contextMenu.openSettings('shortcuts')
    },
  },

  /**
   * 统计信息
   */
  statistics: {
    name: 'Statistics',
    keydown: (ctx) => {
      ctx.statistics.visible.value
        = !ctx.statistics.visible.value
    },
  },
} satisfies ActionMap, ACTION_GROUPS.OTHER)

/** 默认动作 */
export const DEFAULT_ACTION_MAP = {
  ...PLAY_ACTION_MAP,
  ...SOUND_ACTION_MAP,
  ...EPISODE_ACTION_MAP,
  ...SUBTITLE_ACTION_MAP,
  ...WINDOW_ACTION_MAP,
  ...TRANSFORM_ACTION_MAP,
  ...ENHANCE_COLOR_ACTION_MAP,
  ...OTHER_ACTION_MAP,
} satisfies ActionMap
