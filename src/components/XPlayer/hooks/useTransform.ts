import type { CSSProperties } from 'vue'
import type { PlayerContext } from './usePlayerProvide'
import { useElementSize } from '@vueuse/core'
import { computed, shallowRef } from 'vue'

/**
 * 计算旋转视频后的缩放比例，使视频在容器中保持原始比例且不超出容器
 * @param videoWidth 视频宽度
 * @param videoHeight 视频高度
 * @param containerWidth 容器宽度
 * @param containerHeight 容器高度
 * @param angle 旋转角度（度）
 * @returns 缩放比例
 */
function calculateScale(videoWidth: number, videoHeight: number, containerWidth: number, containerHeight: number, angle: number) {
  const ratio = videoWidth / videoHeight
  /** 角度转弧度 */
  const radians = (angle * Math.PI) / 180
  /** 绝对值处理镜像情况 */
  const cos = Math.abs(Math.cos(radians))
  const sin = Math.abs(Math.sin(radians))

  /** 计算旋转后的逻辑包围盒尺寸 */
  const rotatedWidth = containerWidth * cos + containerHeight * sin
  const rotatedHeight = containerWidth * sin + containerHeight * cos

  const scaleW = containerWidth / rotatedWidth
  const scaleH = containerHeight / rotatedHeight
  return ratio > 1 ? Math.min(scaleW, scaleH) : Math.max(scaleW, scaleH)
}

/** 画面转换 */
export function useTransform(_ctx: PlayerContext) {
  /** 旋转角度 */
  const ROTATE_ANGLE = 90
  /** 最大旋转角度 */
  const MAX_ROTATE_ANGLE = 270
  /** 旋转角度 */
  const rotate = shallowRef(0)
  /** 水平翻转 */
  const flipX = shallowRef(false)
  /** 垂直翻转 */
  const flipY = shallowRef(false)
  /** 播放器元素尺寸 */
  const playerSize = useElementSize(_ctx.refs.playerElementRef)
  /** 缩放比例 */
  const scale = computed(() => {
    return calculateScale(
      _ctx.playerCore.value?.videoWidth ?? 16,
      _ctx.playerCore.value?.videoHeight ?? 9,
      playerSize.width.value,
      playerSize.height.value,
      rotate.value,
    )
  })
  /** 样式 */
  const style = computed((): CSSProperties => {
    const transforms = [
      `rotate(${rotate.value}deg)`,
      `scale(${scale.value * (flipX.value ? -1 : 1)}, ${scale.value * (flipY.value ? -1 : 1)})`,
      'translateZ(0)',
    ]

    return {
      transform: transforms.join(' '),
    }
  })

  /** 左旋转是否禁用 */
  const isLeftDisabled = computed(() => {
    // 使用严格相等确保在-270度时禁用
    return rotate.value === -MAX_ROTATE_ANGLE
  })

  /** 右旋转是否禁用 */
  const isRightDisabled = computed(() => {
    // 使用严格相等确保在270度时禁用
    return rotate.value === MAX_ROTATE_ANGLE
  })

  /** 左旋转 */
  const left = () => {
    // 如果已经达到最小角度，不执行操作
    if (rotate.value <= -MAX_ROTATE_ANGLE)
      return
    /** 计算新角度 */
    const newAngle = rotate.value - ROTATE_ANGLE
    // 确保不超过最小角度
    rotate.value = Math.max(newAngle, -MAX_ROTATE_ANGLE)
  }

  /** 右旋转 */
  const right = () => {
    // 如果已经达到最大角度，不执行操作
    if (rotate.value >= MAX_ROTATE_ANGLE)
      return
    /** 计算新角度 */
    const newAngle = rotate.value + ROTATE_ANGLE
    // 确保不超过最大角度
    rotate.value = Math.min(newAngle, MAX_ROTATE_ANGLE)
  }

  /** 正常 */
  const normal = () => {
    rotate.value = 0
    flipX.value = false
    flipY.value = false
  }

  /** 水平翻转 */
  const toggleFlipX = () => {
    flipX.value = !flipX.value
  }

  /** 垂直翻转 */
  const toggleFlipY = () => {
    flipY.value = !flipY.value
  }

  return {
    rotate,
    flipX,
    flipY,
    left,
    right,
    normal,
    toggleFlipX,
    toggleFlipY,
    isLeftDisabled,
    isRightDisabled,
    transformStyle: style,
  }
}
