import type { PlayerContext } from './usePlayerProvide'

/**
 * 预览图设置
 */
export function usePlaySettings(ctx: PlayerContext) {
  /** 切换自动播放 */
  const toggleAutoPlay = () => {
    ctx.rootPropsVm.autoPlay.value = !ctx.rootPropsVm.autoPlay.value
  }

  return {
    // 状态
    autoPlay: ctx.rootPropsVm.autoPlay,
    // 方法
    toggleAutoPlay,
  }
}
