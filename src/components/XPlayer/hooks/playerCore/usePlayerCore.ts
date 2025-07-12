import type { PlayerContext } from '../usePlayerProvide'
import { syncRef, toReactive } from '@vueuse/core'
import { PlayerCoreType } from './types'
import { useAvPlayerCore } from './useAvPlayerCore'
import { useHlsPlayerCore } from './useHlsPlayerCore'
import { useNativePlayerCore } from './useNativePlayerCore'

/**
 * 视频核心混合封装
 */
export function usePlayerCoreDecorator(usePlayerCore:
  | typeof useHlsPlayerCore
  | typeof useNativePlayerCore
  | typeof useAvPlayerCore, ctx: PlayerContext) {
  const player = usePlayerCore(ctx)

  const noop = () => {}

  // 事件监听
  player.on('canplay', ctx.rootProps.onCanplay ?? noop)
  player.on('timeupdate', ctx.rootProps.onTimeupdate ?? noop)
  player.on('seeking', ctx.rootProps.onSeeking ?? noop)
  player.on('seeked', ctx.rootProps.onSeeked ?? noop)

  /** 同步响应式数据 */
  const syncRefList = [
    syncRef(ctx.rootPropsVm.muted, player.muted),
    syncRef(ctx.rootPropsVm.playbackRate, player.playbackRate),
    syncRef(ctx.rootPropsVm.volume, player.volume),
    syncRef(ctx.rootPropsVm.autoPlay, player.autoPlay),
  ]

  /** 取消同步响应式数据 */
  const unSyncRefList = () => {
    syncRefList.forEach((unSyncRef) => {
      unSyncRef()
    })
  }

  return toReactive({
    ...player,
    /** 调整音量 (相对当前音量) */
    adjustVolume: (delta: number) => {
      const newVolume = Math.min(Math.max(0, player.volume.value + delta), 100)
      player.setVolume(newVolume)
    },
    /** 快进快退 (秒数或百分比浮点数) */
    skip: (value: number, isPercent = false) => {
      const newTime = isPercent
        ? value * player.duration.value
        : player.currentTime.value + value
      const clampedTime = Math.min(Math.max(0, newTime), player.duration.value)
      player.seek(clampedTime)
    },
    /** 销毁 */
    destroy: async () => {
      unSyncRefList()
      await player.destroy()
    },
  })
}

/**
 * 切换播放器核心
 */
export function useSwitchPlayerCore(ctx: PlayerContext) {
  let isSwitching = false

  const switchDriver = async (videoType: PlayerCoreType) => {
    // 防止重复切换
    if (isSwitching) {
      console.warn('播放器核心正在切换中，忽略此次请求')
      return
    }

    isSwitching = true

    try {
      // 先销毁现有播放器
      if (ctx.playerCore.value) {
        console.log('正在销毁现有播放器核心:', ctx.playerCore.value.type)
        await ctx.playerCore.value.destroy()
        ctx.playerCore.value = undefined
      }

      // 等待一个微任务，确保销毁完成
      await new Promise(resolve => setTimeout(resolve, 0))

      console.log('正在创建新的播放器核心:', videoType)

      // 创建新的驱动实例
      switch (videoType) {
        case PlayerCoreType.Native:
          ctx.playerCore.value = usePlayerCoreDecorator(
            useNativePlayerCore,
            ctx,
          )
          break
        case PlayerCoreType.Hls:
          ctx.playerCore.value = usePlayerCoreDecorator(useHlsPlayerCore, ctx)
          break
        case PlayerCoreType.AvPlayer:
          ctx.playerCore.value = usePlayerCoreDecorator(useAvPlayerCore, ctx)
          break
        default:
          throw new Error(`Unsupported video type: ${videoType}`)
      }
    }
    catch (error) {
      console.error('切换视频驱动失败:', error)
      throw error
    }
    finally {
      isSwitching = false
    }
  }

  return {
    switchDriver,
  }
}
