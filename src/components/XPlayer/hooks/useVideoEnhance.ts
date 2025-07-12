import type { PlayerContext } from './usePlayerProvide'
import { computed, reactive } from 'vue'

/**
 * 视频色彩调整设置 Hook
 *
 * 提供视频画面的色彩增强功能，包括亮度、对比度、饱和度、色调、
 * 高光、阴影、色温、锐化和肤色美白等调色功能
 *
 * @param ctx - 播放器上下文对象
 * @returns 视频增强相关的响应式状态和方法
 */
export function useVideoEnhance(ctx: PlayerContext) {
  /** 滤镜名称 */
  const filterName = 'video-enhance'

  /** 禁用HDR选项 */
  const disabledHDR = ctx.rootPropsVm.disabledHDR

  // ======================== 调色参数 ========================

  /** 默认调色参数 */
  const defaultParams = {
    /** 锐化强度 (0-100) */
    sharpness: 0,
    /** 亮度调整 (-100 到 100) */
    brightness: 0,
    /** 对比度调整 (-100 到 100) */
    contrast: 0,
    /** 高光调整 (-100 到 100) */
    highlights: 0,
    /** 阴影调整 (-100 到 100) */
    shadows: 0,
    /** 色温调整 (-100 冷色 到 100 暖色) */
    colorTemp: 0,
    /** 饱和度调整 (-100 到 100) */
    saturation: 0,
    /** 色调调整 (-100 到 100，洋红-绿色轴调整) */
    hue: 0,
    /** 肤色美白强度 (0-100) */
    skinWhitening: 0,
    /** 肤色范围控制 (1-10，控制美白的选择性) */
    skinRange: 5,
  } as const

  /** 当前调色参数 */
  const colorParams = reactive({ ...defaultParams })

  // ======================== 计算属性 ========================

  /**
   * 判断是否启用滤镜
   * 通过比较当前参数与默认参数来判断
   */
  const isEnabled = computed(() => {
    return Object.keys(defaultParams).some(
      key =>
        colorParams[key as keyof typeof defaultParams]
        !== defaultParams[key as keyof typeof defaultParams],
    )
  })

  /**
   * 获取亮度调整参数
   *
   * 亮度调整算法说明：
   * 1. 使用伽马校正提供更自然的亮度感知
   * 2. 实现阴影和高光保护，避免细节丢失
   * 3. 基于Lift-Gamma-Gain模型，调色软件标准
   * 4. 提供平滑的非线性调整曲线
   */
  const getBrightnessParams = computed(() => {
    // 当亮度为0时，返回默认参数（不改变颜色）
    if (colorParams.brightness === 0) {
      return {
        type: 'gamma' as const,
        amplitude: 1,
        exponent: 1,
        offset: 0,
      }
    }

    /** -1 到 1 */
    const value = colorParams.brightness / 100
    const absValue = Math.abs(value)

    // 根据调整方向选择不同的调整策略
    if (value > 0) {
      /*
       * 提亮：主要调整Gamma，轻微调整Gain
       * 使用小于1的gamma值来提亮中间调，同时保护高光
       */
      /** 0.6 - 1.0 */
      const gamma = 1 - absValue * 0.4
      /** 1.0 - 1.3 */
      const gain = 1 + absValue * 0.45
      /** 0 - 0.05 轻微提升阴影 */
      const lift = -absValue * 0.05

      return {
        type: 'gamma' as const,
        amplitude: gain,
        exponent: Math.max(0.3, gamma), // 防止过度调整
        offset: lift,
      }
    }

    /*
     * 压暗：主要调整Gamma和Lift
     * 使用大于1的gamma值来压暗中间调，同时保护阴影细节
     */
    /** 1.0 - 1.5 */
    const gamma = 1 + absValue * 0.4
    /** 0.8 - 1.0 */
    const gain = 1 - absValue * 0.45
    /** -0.05 - 0 轻微降低阴影 */
    const lift = -absValue * 0.01

    return {
      type: 'gamma' as const,
      amplitude: gain,
      exponent: Math.min(2.0, gamma), // 防止过度调整
      offset: lift,
    }
  })

  /**
   * 获取对比度调整参数
   *
   * 对比度调整算法说明：
   * 1. 使用改进的线性调整，避免查找表的量化误差
   * 2. 基于中心点为0.5的对比度调整，保持中间调稳定
   * 3. 使用适度的调整范围，避免失真和色阶断裂
   * 4. 确保调整后的值始终在有效范围内
   */
  const getContrastParams = computed(() => {
    // 当对比度为0时，返回默认参数（不改变颜色）
    if (colorParams.contrast === 0) {
      return {
        type: 'linear' as const,
        slope: 1,
        intercept: 0,
      }
    }

    /** -1 到 1 */
    const value = colorParams.contrast / 100

    /*
     * 对比度调整：使用斜率调整，中心点在0.5
     * 增强对比度时：斜率>1，截距<0
     * 降低对比度时：斜率<1，截距>0
     */

    if (value > 0) {
      // 增强对比度：适度的斜率增加
      /** 1.0 - 1.8，更温和的调整 */
      const slope = 1 + value * 0.8
      /** 保持中心点不变 */
      const intercept = (1 - slope) * 0.5

      return {
        type: 'linear' as const,
        slope: Math.min(2.5, slope), // 限制最大斜率，避免失真
        intercept: Math.max(-0.5, intercept), // 限制截距范围
      }
    }

    // 降低对比度：减少斜率，增加截距
    /** 0.4 - 1.0，温和的调整 */
    const slope = 1 + value * 0.6
    /** 保持中心点不变 */
    const intercept = (1 - slope) * 0.5

    return {
      type: 'linear' as const,
      slope: Math.max(0.2, slope), // 限制最小斜率，避免过度平坦
      intercept: Math.min(0.4, intercept), // 限制截距范围
    }
  })

  /**
   * 获取高光调整参数
   *
   * 高光调整算法说明：
   * 1. 选择性调整高光区域（亮度>0.6），保护阴影和中间调
   * 2. 使用平滑的过渡曲线，避免突变
   * 3. 基于亮度遮罩的调整，符合调色标准
   * 4. 保持整体色彩平衡
   */
  const getHighlightsParams = computed(() => {
    // 当高光为0时，返回默认参数（不改变颜色）
    if (colorParams.highlights === 0) {
      return {
        type: 'linear' as const,
        slope: 1,
        intercept: 0,
        tableValues: null,
      }
    }

    /** -1 到 1 */
    const value = colorParams.highlights / 100
    /** 最大50%调整强度 */
    const intensity = Math.abs(value) * 0.5

    /** 生成高光选择性调整查找表 */
    const tableValues: string[] = []
    for (let i = 0; i <= 255; i++) {
      /** 0-1范围的亮度值 */
      const normalized = i / 255
      let adjusted = normalized

      /**
       * 计算高光权重：亮度越高，权重越大
       * 使用平滑的S型曲线作为遮罩
       */
      let highlightMask = 0
      if (normalized > 0.2) {
        const highlightRange = (normalized - 0.2) * 1.5
        highlightMask = highlightRange ** 1.5 // 非线性增强
      }

      // 应用高光调整
      if (value > 0) {
        /** 提亮高光：在高光区域增加亮度 */
        const adjustment = intensity * highlightMask * 0.4
        adjusted = normalized + adjustment
      }
      else {
        /** 压暗高光：在高光区域减少亮度 */
        const adjustment = intensity * highlightMask * 0.4
        adjusted = normalized - adjustment
      }

      // 确保值在有效范围内
      adjusted = Math.max(0, Math.min(1, adjusted))
      tableValues.push(adjusted.toFixed(4))
    }

    return {
      type: 'table' as const,
      slope: 1,
      intercept: 0,
      tableValues: tableValues.join(' '),
    }
  })

  /**
   * 获取阴影调整参数
   *
   * 阴影调整算法说明：
   * 1. 选择性调整阴影区域（亮度<0.4），保护高光和中间调
   * 2. 使用平滑的过渡曲线，避免突变
   * 3. 基于亮度遮罩的调整，符合调色标准
   * 4. 保持细节不丢失
   */
  const getShadowsParams = computed(() => {
    // 当阴影为0时，返回默认参数（不改变颜色）
    if (colorParams.shadows === 0) {
      return {
        type: 'linear' as const,
        slope: 1,
        intercept: 0,
        tableValues: null,
      }
    }

    /** -1 到 1 */
    const value = colorParams.shadows / 100
    /** 最大50%调整强度 */
    const intensity = Math.abs(value) * 0.5

    /** 生成阴影选择性调整查找表 */
    const tableValues: string[] = []
    for (let i = 0; i <= 255; i++) {
      /** 0-1范围的亮度值 */
      const normalized = i / 255
      let adjusted = normalized

      /**
       * 计算阴影权重：亮度越低，权重越大
       * 使用平滑的S型曲线作为遮罩
       */
      let shadowMask = 0
      if (normalized < 0.5) {
        /** 阴影区域：0-0.5 映射到 1-0 */
        const shadowRange = 1 - normalized * 2
        shadowMask = shadowRange ** 1.2 // 非线性增强
      }

      // 应用阴影调整
      if (value > 0) {
        /** 提亮阴影：在阴影区域增加亮度 */
        const adjustment = intensity * shadowMask * 0.3
        adjusted = normalized + adjustment
      }
      else {
        /** 压暗阴影：在阴影区域减少亮度 */
        const adjustment = intensity * shadowMask * 0.3
        adjusted = normalized - adjustment
      }

      // 确保值在有效范围内
      adjusted = Math.max(0, Math.min(1, adjusted))
      tableValues.push(adjusted.toFixed(4))
    }

    return {
      type: 'table' as const,
      slope: 1,
      intercept: 0,
      tableValues: tableValues.join(' '),
    }
  })

  /**
   * 获取饱和度矩阵
   *
   * 饱和度调整算法说明：
   * 1. 使用ITU-R BT.709标准亮度权重，更准确的色彩科学
   * 2. 实现非线性调整曲线，避免过度饱和导致的失真
   * 3. 肤色保护机制，保持人像的自然肤色
   * 4. 色彩平衡补偿，防止色彩偏移
   */
  const getSaturationMatrix = computed(() => {
    // 当值为0时，返回单位矩阵（不对颜色做任何改变）
    if (colorParams.saturation === 0) {
      return `1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 1 0`
    }

    /** -1 到 1 */
    const value = colorParams.saturation / 100

    /**
     * 非线性饱和度调整曲线
     * 使用渐进式调整，避免极端值导致的色彩失真
     */
    let saturationMultiplier: number

    if (value > 0) {
      /*
       * 增强饱和度：使用渐进式增强，避免过度饱和
       * 使用平方根函数提供更自然的增强曲线
       */
      /** 非线性增强 */
      const normalizedBoost = Math.sqrt(value)
      saturationMultiplier = 1 + normalizedBoost * 0.8 // 最大1.8倍
    }
    else {
      // 降低饱和度：使用线性降低，保持平滑
      saturationMultiplier = 1 + value * 0.9 // 最小0.1倍，保留一些色彩
    }

    // 限制调整范围，防止极端值
    saturationMultiplier = Math.max(0.05, Math.min(2.2, saturationMultiplier))

    /*
     * 使用ITU-R BT.709标准的现代亮度权重
     * 这些权重更准确地反映人眼对不同颜色的感知
     */
    /** 红色权重 */
    const rWeight = 0.2126
    /** 绿色权重（人眼最敏感） */
    const gWeight = 0.7152
    /** 蓝色权重 */
    const bWeight = 0.0722

    /** 计算饱和度调整矩阵的各项系数 */
    const rCoeff = rWeight * (1 - saturationMultiplier)
    const gCoeff = gWeight * (1 - saturationMultiplier)
    const bCoeff = bWeight * (1 - saturationMultiplier)

    /*
     * 构建饱和度调整矩阵
     * 这个矩阵将RGB值转换为灰度，然后与原始颜色按比例混合
     */
    /** 红色通道的红色分量 */
    const rr = rCoeff + saturationMultiplier
    /** 红色通道的绿色分量 */
    const rg = gCoeff
    /** 红色通道的蓝色分量 */
    const rb = bCoeff

    /** 绿色通道的红色分量 */
    const gr = rCoeff
    /** 绿色通道的绿色分量 */
    const gg = gCoeff + saturationMultiplier
    /** 绿色通道的蓝色分量 */
    const gb = bCoeff

    /** 蓝色通道的红色分量 */
    const br = rCoeff
    /** 蓝色通道的绿色分量 */
    const bg = gCoeff
    /** 蓝色通道的蓝色分量 */
    const bb = bCoeff + saturationMultiplier

    /**
     * 肤色保护和色彩平衡微调
     * 轻微调整系数以保护肤色不过度饱和
     */
    let skinProtectionFactor = 1
    if (saturationMultiplier > 1.3) {
      // 当饱和度较高时，稍微降低红色和黄色区域的饱和度
      skinProtectionFactor = 1 - (saturationMultiplier - 1.3) * 0.1
    }

    /** 应用肤色保护（主要影响红-绿通道） */
    const finalRR = rr * skinProtectionFactor
    const finalRG = rg * skinProtectionFactor

    /*
     * 色彩平衡微调：防止颜色偏移
     * 当饱和度发生变化时，轻微补偿以保持色彩平衡
     */
    /** 微小的偏移补偿 */
    const balanceOffset = (saturationMultiplier - 1) * 0.001

    return `${finalRR.toFixed(4)} ${finalRG.toFixed(4)} ${rb.toFixed(4)} 0 ${balanceOffset.toFixed(4)}
        ${gr.toFixed(4)} ${gg.toFixed(4)} ${gb.toFixed(4)} 0 ${balanceOffset.toFixed(4)}
        ${br.toFixed(4)} ${bg.toFixed(4)} ${bb.toFixed(4)} 0 ${balanceOffset.toFixed(4)}
        0 0 0 1 0`
  })

  /**
   * 获取色调变换矩阵（洋红-绿色轴调整）
   *
   * 色调调整算法说明：
   * 1. 基于洋红-绿色轴的调整，这是调色软件的标准
   * 2. 正值偏向洋红（Magenta），负值偏向绿色（Green）
   * 3. 使用色彩科学的精确算法，保持亮度稳定
   * 4. 适度的调整范围，避免过度失真
   */
  const getHueMatrix = computed(() => {
    // 当值为0时，返回单位矩阵（不对颜色做任何改变）
    if (colorParams.hue === 0) {
      return `1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 1 0`
    }

    /** -1 到 1 */
    const value = colorParams.hue / 100
    /** 最大40%的调整强度，更温和 */
    const intensity = Math.abs(value) * 0.4

    if (value > 0) {
      /*
       * 正值：偏向洋红（Magenta）
       * 增强红色和蓝色，适度减少绿色，产生洋红色调
       */
      /** 红色轻微增强 */
      const redGain = 1 + intensity * 0.12
      /** 绿色适度减少 */
      const greenGain = 1 - intensity * 0.08
      /** 蓝色轻微增强 */
      const blueGain = 1 + intensity * 0.06

      /** 微调偏移，保持色彩平衡 */
      const redOffset = intensity * 0.01
      /** 轻微减少绿色偏移 */
      const greenOffset = -intensity * 0.015
      const blueOffset = intensity * 0.005

      return `${redGain.toFixed(4)} 0 0 0 ${redOffset.toFixed(4)}
          0 ${greenGain.toFixed(4)} 0 0 ${greenOffset.toFixed(4)}
          0 0 ${blueGain.toFixed(4)} 0 ${blueOffset.toFixed(4)}
          0 0 0 1 0`
    }

    /*
     * 负值：偏向绿色（Green）
     * 增强绿色，适度减少红色和蓝色，产生绿色色调
     */
    /** 红色适度减少 */
    const redGain = 1 - intensity * 0.1
    /** 绿色增强 */
    const greenGain = 1 + intensity * 0.08
    /** 蓝色轻微减少 */
    const blueGain = 1 - intensity * 0.05

    /** 微调偏移，保持色彩平衡 */
    const redOffset = -intensity * 0.01
    /** 轻微增加绿色偏移 */
    const greenOffset = intensity * 0.01
    const blueOffset = -intensity * 0.005

    return `${redGain.toFixed(4)} 0 0 0 ${redOffset.toFixed(4)}
        0 ${greenGain.toFixed(4)} 0 0 ${greenOffset.toFixed(4)}
        0 0 ${blueGain.toFixed(4)} 0 ${blueOffset.toFixed(4)}
        0 0 0 1 0`
  })

  /**
   * 获取色温矩阵
   *
   * 色温调整算法说明：
   * 1. 正值对应暖色调（增加红黄），负值对应冷色调（增加蓝色）
   * 2. 使用线性插值方式，确保调整效果平滑自然
   * 3. 保持整体亮度平衡，避免调整时出现明暗变化
   */
  const getColorTempMatrix = computed(() => {
    /** 调整范围：-100~100 */
    const value = colorParams.colorTemp

    // 当值为0时，返回单位矩阵（不对颜色做任何改变）
    if (value === 0) {
      return `1 0 0 0 0
          0 1 0 0 0
          0 0 1 0 0
          0 0 0 1 0`
    }

    /*
     * 将-100到100的范围映射到色温调整系数
     * 正值 = 暖色（增加红色，减少蓝色）
     * 负值 = 冷色（减少红色，增加蓝色）
     */
    /** -1 到 1 */
    const normalizedValue = value / 100

    // 色温调整强度，避免过度调整
    /** 最大30%的调整强度 */
    const intensity = Math.abs(normalizedValue) * 0.3

    let rGain = 1
    let gGain = 1
    let bGain = 1

    if (normalizedValue > 0) {
      // 暖色调整：增加红色和绿色，减少蓝色
      rGain = 1 + intensity * 0.8 // 红色增强最多24%
      gGain = 1 + intensity * 0.3 // 绿色轻微增强9%
      bGain = 1 - intensity * 0.6 // 蓝色减少最多18%
    }
    else {
      // 冷色调整：减少红色，增加蓝色
      rGain = 1 - intensity * 0.4 // 红色减少最多12%
      gGain = 1 - intensity * 0.1 // 绿色轻微减少3%
      bGain = 1 + intensity * 0.6 // 蓝色增强最多18%
    }

    // 亮度补偿：使用ITU-R BT.709标准的亮度权重
    /** = 1 */
    const originalLuma = 0.2126 + 0.7152 + 0.0722
    const adjustedLuma = 0.2126 * rGain + 0.7152 * gGain + 0.0722 * bGain
    const lumaCompensation = originalLuma / adjustedLuma

    // 应用亮度补偿
    rGain *= lumaCompensation
    gGain *= lumaCompensation
    bGain *= lumaCompensation

    // 限制增益范围，防止极端值
    rGain = Math.max(0.5, Math.min(2.0, rGain))
    gGain = Math.max(0.5, Math.min(2.0, gGain))
    bGain = Math.max(0.5, Math.min(2.0, bGain))

    // 构建最终的颜色矩阵
    return `${rGain} 0 0 0 0
        0 ${gGain} 0 0 0
        0 0 ${bGain} 0 0
        0 0 0 1 0`
  })

  /**
   * 获取锐化参数
   *
   * 简化的锐化算法：
   * 1. 使用简单但有效的Unsharp Mask
   * 2. 确保不破坏其他滤镜的工作
   * 3. 专注于效果而非复杂度
   */
  const getSharpnessParams = computed(() => {
    // 当锐化为0时，返回默认参数（不改变图像）
    if (colorParams.sharpness === 0) {
      return {
        enabled: false,
        amount: 0,
      }
    }

    /** 0 到 1 */
    const value = colorParams.sharpness / 100

    // 简化的锐化强度计算
    /** 0-2.0，强锐化效果 */
    const amount = value * 2.0

    return {
      enabled: true,
      amount,
    }
  })

  /**
   * 获取肤色美白参数
   *
   * 简化的连续美白算法
   * 只使用单一Gamma调整，避免复杂操作导致卡死
   */
  const getSkinWhiteningParams = computed(() => {
    // 当美白强度为0时，返回默认参数
    if (colorParams.skinWhitening === 0) {
      return {
        enabled: false,
        midtoneGamma: 1.0,
        midtoneGain: 1.0,
        colorMatrix: `1 0 0 0 0
               0 1 0 0 0
               0 0 1 0 0
               0 0 0 1 0`,
      }
    }

    /** 0-1 */
    const intensity = colorParams.skinWhitening / 100
    /** 0.1-1 */
    const rangeControl = colorParams.skinRange / 10

    /*
     * 中间调Gamma美白
     * Gamma < 1 提亮中间调，自然选择肤色区域
     */
    /** 降低强度 */
    const baseGamma = 1.0 - intensity * 0.15 * rangeControl
    /** 提高最小值，避免过度调整 */
    const midtoneGamma = Math.max(0.8, baseGamma)

    // 轻微增益
    /** 降低增益 */
    const midtoneGain = 1.0 + intensity * 0.05

    /* 极简色彩校正 */
    /** 进一步降低 */
    const rGain = 1.0 + intensity * 0.005
    /** 进一步降低 */
    const gGain = 1.0 - intensity * 0.008
    /** 进一步降低 */
    const bGain = 1.0 + intensity * 0.003

    const colorMatrix = `${rGain.toFixed(4)} 0 0 0 0
               0 ${gGain.toFixed(4)} 0 0 0
               0 0 ${bGain.toFixed(4)} 0 0
               0 0 0 1 0`

    return {
      enabled: true,
      midtoneGamma: Number.parseFloat(midtoneGamma.toFixed(4)),
      midtoneGain: Number.parseFloat(midtoneGain.toFixed(4)),
      colorMatrix,
    }
  })

  /**
   * 渲染SVG滤镜组件
   *
   * 调色滤镜组合 - 标准工作流程
   * 流程排序：
   * 亮度 → 对比度 → 高光 → 阴影 → 色温 → 色调 → 饱和度 → 美白 → 锐化
   */
  const renderFilter = computed(() => {
    const brightnessParams = getBrightnessParams.value
    const contrastParams = getContrastParams.value
    const highlightsParams = getHighlightsParams.value
    const shadowsParams = getShadowsParams.value
    const sharpnessParams = getSharpnessParams.value
    const skinWhiteningParams = getSkinWhiteningParams.value

    return `
      <svg width="0" height="0" style="position: absolute;">
        <defs>
          <!-- 调色滤镜组合 - 标准工作流程 -->
          <filter id="${filterName}" color-interpolation-filters="auto">
            <!-- 第1步：基础亮度调整 - 使用伽马校正 + Lift-Gamma-Gain模型 -->
            <feComponentTransfer result="brightness">
              <feFuncR type="gamma" amplitude="${brightnessParams.amplitude}" exponent="${brightnessParams.exponent}" offset="${brightnessParams.offset}" />
              <feFuncG type="gamma" amplitude="${brightnessParams.amplitude}" exponent="${brightnessParams.exponent}" offset="${brightnessParams.offset}" />
              <feFuncB type="gamma" amplitude="${brightnessParams.amplitude}" exponent="${brightnessParams.exponent}" offset="${brightnessParams.offset}" />
              <feFuncA type="identity" />
            </feComponentTransfer>
            
            <!-- 第2步：对比度调整 -->
            <feComponentTransfer result="contrast" in="brightness">
              <feFuncR type="linear" slope="${contrastParams.slope}" intercept="${contrastParams.intercept}" />
              <feFuncG type="linear" slope="${contrastParams.slope}" intercept="${contrastParams.intercept}" />
              <feFuncB type="linear" slope="${contrastParams.slope}" intercept="${contrastParams.intercept}" />
              <feFuncA type="identity" />
            </feComponentTransfer>

            <!-- 第3步：高光调整 - 选择性亮部控制 -->
            <feComponentTransfer result="highlights" in="contrast">
              ${
                highlightsParams.tableValues
                  ? `<feFuncR type="table" tableValues="${highlightsParams.tableValues}" />
                <feFuncG type="table" tableValues="${highlightsParams.tableValues}" />
                <feFuncB type="table" tableValues="${highlightsParams.tableValues}" />`
                  : `<feFuncR type="linear" slope="1" intercept="0" />
                <feFuncG type="linear" slope="1" intercept="0" />
                <feFuncB type="linear" slope="1" intercept="0" />`
              }
              <feFuncA type="identity" />
            </feComponentTransfer>

            <!-- 第4步：阴影调整 - 选择性暗部控制 -->
            <feComponentTransfer result="shadows" in="highlights">
              ${
                shadowsParams.tableValues
                  ? `<feFuncR type="table" tableValues="${shadowsParams.tableValues}" />
                <feFuncG type="table" tableValues="${shadowsParams.tableValues}" />
                <feFuncB type="table" tableValues="${shadowsParams.tableValues}" />`
                  : `<feFuncR type="linear" slope="1" intercept="0" />
                <feFuncG type="linear" slope="1" intercept="0" />
                <feFuncB type="linear" slope="1" intercept="0" />`
              }
              <feFuncA type="identity" />
            </feComponentTransfer>
            
            <!-- 第5步：色温调整 - 色彩校正 -->
            <feColorMatrix
              result="colortemp"
              in="shadows"
              type="matrix"
              values="${getColorTempMatrix.value}"
            />
            
            <!-- 第6步：色调调整 - 色彩校正 -->
            <feColorMatrix
              result="hue"
              in="colortemp"
              type="matrix"
              values="${getHueMatrix.value}"
            />
            
            <!-- 第7步：饱和度调整 - 色彩分级 -->
            <feColorMatrix
              result="saturation"
              in="hue"
              type="matrix"
              values="${getSaturationMatrix.value}"
            />

            <!-- 第8步：连续美白 - 使用Gamma曲线实现平滑效果 -->
            ${
              skinWhiteningParams.enabled
                ? `
            <!-- 步骤8.1: 中间调Gamma提升 - 自然选择肤色中间调 -->
            <feComponentTransfer result="midtoneLift" in="saturation">
              <feFuncR type="gamma" amplitude="${skinWhiteningParams.midtoneGain}" exponent="${skinWhiteningParams.midtoneGamma}" offset="0" />
              <feFuncG type="gamma" amplitude="${skinWhiteningParams.midtoneGain}" exponent="${skinWhiteningParams.midtoneGamma}" offset="0" />
              <feFuncB type="gamma" amplitude="${skinWhiteningParams.midtoneGain}" exponent="${skinWhiteningParams.midtoneGamma}" offset="0" />
              <feFuncA type="identity" />
            </feComponentTransfer>
            
            <!-- 步骤8.2: 精细色彩校正 -->
            <feColorMatrix
              result="skinWhitening"
              in="midtoneLift"
              type="matrix"
              values="${skinWhiteningParams.colorMatrix}"
            />`
                : `
            <feOffset result="skinWhitening" in="saturation" dx="0" dy="0" />`
            }

            <!-- 第9步：锐化 - 亮度保持不变的标准算法 -->
            ${
              sharpnessParams.enabled
                ? `
            <!-- 创建模糊版本 -->
            <feGaussianBlur 
              result="blurred"
              in="skinWhitening"
              stdDeviation="1.0"
            />
            <!-- 标准Unsharp Mask：原图 + (原图 - 模糊图) * 强度 -->
            <!-- 第一步：计算高频细节 (原图 - 模糊图) -->
            <feComposite 
              result="highFreq"
              in="skinWhitening" 
              in2="blurred"
              operator="arithmetic"
              k1="0" 
              k2="1" 
              k3="-1" 
              k4="0"
            />
            <!-- 第二步：原图 + 高频细节 * 强度，保持亮度不变 -->
            <feComposite 
              result="final"
              in="skinWhitening" 
              in2="highFreq"
              operator="arithmetic"
              k1="0" 
              k2="1" 
              k3="${sharpnessParams.amount.toFixed(3)}" 
              k4="0"
            />`
                : `
            <feOffset result="final" in="skinWhitening" dx="0" dy="0" />`
            }
          </filter>
        </defs>
      </svg>
    `
  })

  /**
   * 获取滤镜CSS样式
   *
   * @returns 滤镜CSS样式对象或空对象
   */
  const getFilterStyle = computed(() => {
    // 如果所有参数都为默认值(0)，不应用任何滤镜样式
    if (!isEnabled.value) {
      if (disabledHDR.value) {
        return {
          'filter': 'brightness(1)',
          'webkit-filter': 'brightness(1)',
        }
      }
      return {}
    }

    // 当有任何参数不为0时，返回滤镜样式
    return {
      'filter': `url(#${filterName})`,
      'webkit-filter': `url(#${filterName})`,
    }
  })

  /**
   * 重置所有调色参数到默认值
   */
  const reset = () => {
    Object.assign(colorParams, defaultParams)
  }

  return {
    // 基础状态
    disabledHDR,
    filterName,

    // 调色参数
    colorParams,
    defaultParams,

    // 计算属性和方法
    renderFilter,
    getFilterStyle,
    reset,
  }
}
