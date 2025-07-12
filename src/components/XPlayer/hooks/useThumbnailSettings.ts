import type { PlayerContext } from './usePlayerProvide'

/**
 * 预览图设置
 */
export function useThumbnailSettings(ctx: PlayerContext) {
  /** 切换自动加载预览图 */
  const toggleAutoLoad = () => {
    ctx.rootPropsVm.autoLoadThumbnails.value
      = !ctx.rootPropsVm.autoLoadThumbnails.value
  }

  /** 设置采样间隔 */
  const setSamplingInterval = (interval: number) => {
    ctx.rootPropsVm.thumbnailsSamplingInterval.value = interval
  }

  return {
    // 状态
    autoLoadThumbnails: ctx.rootPropsVm.autoLoadThumbnails,
    samplingInterval: ctx.rootPropsVm.thumbnailsSamplingInterval,
    // 方法
    toggleAutoLoad,
    setSamplingInterval,
  }
}
