import type { PlayerContext } from './usePlayerProvide'
import { useEventListener } from '@vueuse/core'
import { shallowRef } from 'vue'

/**
 * 全屏和播放列表
 */
export function useFullscreen(ctx: PlayerContext) {
  /** 显示播放列表 */
  const showPlaylist = ctx.rootPropsVm.showPlaylist
  /** 是否全屏 */
  const isFullscreen = shallowRef(false)
  /** 全屏前播放列表状态 */
  const prevShowPlaylist = shallowRef(false)
  /** 监听全屏变化 */
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement
  }

  /** 全屏控制 */
  const toggleFullscreen = async () => {
    ctx.controls.lockControlsWithTimeoutUnlock()
    try {
      // 请求全屏
      if (!document.fullscreenElement) {
        window.scrollTo(0, 0)
        await document.documentElement.requestFullscreen()
        prevShowPlaylist.value = showPlaylist.value
        if (showPlaylist.value) {
          showPlaylist.value = false
        }
      }
      // 退出全屏
      else {
        await document.exitFullscreen()
        if (prevShowPlaylist.value) {
          showPlaylist.value = true
        }
      }
    }
    catch (error) {
      console.error('Failed to toggle fullscreen:', error)
    }
  }

  /** 播放列表 */
  const toggleShowSider = async () => {
    const newValue = !showPlaylist.value
    showPlaylist.value = newValue
  }

  useEventListener(document, 'fullscreenchange', handleFullscreenChange)
  useEventListener(document, 'webkitfullscreenchange', handleFullscreenChange)
  useEventListener(document, 'mozfullscreenchange', handleFullscreenChange)
  useEventListener(document, 'MSFullscreenChange', handleFullscreenChange)

  return {
    showPlaylist,
    isFullscreen,
    toggleFullscreen,
    toggleShowSider,
  }
}
