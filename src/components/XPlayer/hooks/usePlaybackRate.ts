import type { PlayerContext } from './usePlayerProvide'
import { computed, shallowRef } from 'vue'

/** 播放速度 */
export function usePlaybackRate(ctx: PlayerContext) {
  /** 正常倍速 */
  const NORMAL_RATE = 1
  /** 最小倍速 */
  const MIN_RATE = 0.3
  /** 最大倍速 */
  const MAX_RATE = 15
  /** 预设的倍速选项 */
  const rateOptions = shallowRef([
    MIN_RATE,
    0.5,
    0.7,
    NORMAL_RATE,
    1.3,
    1.5,
    1.7,
    2,
    3,
    5,
    10,
    MAX_RATE,
  ])
  /** 播放速度 */
  const current = ctx.rootPropsVm.playbackRate
  /** 当前倍速的索引 */
  const currentRateIndex = computed(
    () => rateOptions.value.findIndex(r => r === current.value) ?? -1,
  )
  /** 是否启用长按快速前进 */
  const fastForward = shallowRef(false)

  /** 设置播放速度 */
  const set = (rate: number) => {
    ctx.playerCore.value?.setPlaybackRate(rate)
  }

  /** 调整播放速度 */
  const setByIndex = (index: number) => {
    if (index < 0 || index >= rateOptions.value.length)
      return
    const newRate = rateOptions.value[index]
    set(newRate)
  }

  /** 增加播放速度 */
  const up = () => {
    setByIndex(currentRateIndex.value + 1)
  }

  /** 减少播放速度 */
  const down = () => {
    setByIndex(currentRateIndex.value - 1)
  }

  /** 减少播放速度并限制下限 */
  const downWithLowerLimit = () => {
    if (current.value <= NORMAL_RATE)
      return
    setByIndex(currentRateIndex.value - 1)
  }

  /** 长按快速前进 */
  const holdPlaybackRate = shallowRef(1)
  const startLongPressFastForward = () => {
    if (!ctx.playerCore.value || fastForward.value)
      return
    fastForward.value = true
    set(MAX_RATE)
    holdPlaybackRate.value = current.value
    if (ctx.playerCore.value.paused) {
      ctx.playerCore.value.play()
    }
  }

  /** 停止长按快速前进 */
  const stopLongPressFastForward = () => {
    if (!ctx.playerCore.value)
      return
    fastForward.value = false
    set(holdPlaybackRate.value)
  }

  return {
    MIN_RATE,
    MAX_RATE,
    NORMAL_RATE,
    current,
    rateOptions,
    fastForward,
    set,
    up,
    down,
    downWithLowerLimit,
    startLongPressFastForward,
    stopLongPressFastForward,
  }
}
