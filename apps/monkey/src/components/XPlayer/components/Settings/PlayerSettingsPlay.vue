<template>
  <div :class="styles.container">
    <!-- 控制设置分组 -->
    <div :class="styles.groupWrapper">
      <div :class="styles.groupTitle">
        <span>控制</span>
      </div>
      <div :class="styles.groupContent">
        <!-- 自动播放 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">自动播放</span>
            <input
              type="checkbox"
              :checked="playSettings.autoPlay.value"
              class="toggle toggle-sm toggle-primary"
              @change="playSettings.toggleAutoPlay"
            >
          </div>
          <a
            :class="styles.hint"
            class="link link-hover"
            href="https://github.com/cbingb666/115master/discussions/206"
            target="_blank"
          >如何开启声音？
          </a>
        </div>
        <!-- 长按倍速 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">长按倍速</span>
            <label class="input input-sm bg-base-200 border-base-content/20 w-30">
              <input
                type="number"
                min="0.1"
                max="15"
                step="0.1"
                :value="preferences.longPressPlaybackRate.value"
                @input="handleLongPressRateChange"
              >
            </label>
          </div>
        </div>

        <!-- 快进 / 后退 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">快进 / 后退</span>
            <label class="input input-sm bg-base-200 border-base-content/20 w-30">
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                :value="preferences.seekSeconds.value"
                @input="handleSeekSecondsChange"
              >
              <span>S</span>
            </label>
          </div>
        </div>

        <!-- 高速快进 / 后退 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">高速快进 / 后退</span>
            <label class="input input-sm bg-base-200 border-base-content/20 w-30">
              <input
                type="number"
                min="1"
                max="300"
                step="1"
                :value="preferences.highSpeedSeekSeconds.value"
                @input="handleHighSpeedSeekSecondsChange"
              >
              <span>S</span>
            </label>
          </div>
        </div>

        <!-- 百分比快进 / 后退 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">百分比快进 / 后退</span>
            <label class="input input-sm bg-base-200 border-base-content/20 w-30">
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                :value="preferences.percentageSeek.value"
                @input="handlePercentageSeekChange"
              >
              <span>%</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <!-- 预览图设置分组 -->
    <div :class="styles.groupWrapper">
      <div :class="styles.groupTitle">
        <span>预览图</span>
      </div>
      <div :class="styles.groupContent">
        <!-- 自动缓冲 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">自动缓冲预览图</span>
            <span :class="styles.label">
              <input
                type="checkbox"
                :checked="thumbnailSettings.autoLoadThumbnails.value"
                class="toggle toggle-sm toggle-primary"
                @change="thumbnailSettings.toggleAutoLoad"
              >
            </span>
          </div>
        </div>
        <!-- 采样间隔 -->
        <div :class="styles.item">
          <div :class="styles.label">
            <span :class="styles.labelText">最大采样间隔 (秒)</span>
            <select
              :value="thumbnailSettings.samplingInterval.value"
              class="select select-sm bg-base-200 border-base-content/20 w-30 appearance-none"
            >
              <option
                v-for="interval in samplingIntervals" :key="interval" :value="interval"
                @change="thumbnailSettings.setSamplingInterval(interval)"
              >
                {{ interval }} S
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  container: [
    'px-2 py-8',
    'flex-1 overflow-y-auto',
  ],
  // ===== 分组容器 =====
  groupWrapper: 'mb-8 last:mb-0',
  groupTitle: [
    'mx-4 mt-6 mb-3 first:mt-0',
    'flex items-center gap-1.5',
    'text-md font-semibold',
    'pl-4',
  ],
  groupContent: [
    'mx-4',
    'bg-base-200',
    'rounded-2xl',
  ],

  // ===== 设置项 =====
  item: [
    'relative',
    'px-4 py-4',
    'before:[""]',
    'before:absolute',
    'before:inset-x-4',
    'before:inset-y-0',
    'before:border-b-1',
    'before:border-base-content/10',
    'before:pointer-events-none',
    'last:before:border-b-0',
  ],
  label: [
    'flex items-center justify-between',
  ],
  labelText: [
    'text-base-content/90',
    'text-sm font-medium',
  ],
  value: [
    'text-primary text-md font-semibold',
    'text-right',
  ],
  hint: [
    'text-base-content/50 text-xs leading-relaxed',
  ],
})

const { rootPropsVm, rootEmit, playSettings, thumbnailSettings } = usePlayerContext()
const preferences = rootPropsVm

/** 最大采样间隔选项 */
const samplingIntervals = [30, 60, 120]

/** 处理长按倍速变化 */
function handleLongPressRateChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  rootEmit('update:longPressPlaybackRate', value)
}

/** 处理快进秒数变化 */
function handleSeekSecondsChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  rootEmit('update:seekSeconds', value)
}

/** 处理高速快进秒数变化 */
function handleHighSpeedSeekSecondsChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  rootEmit('update:highSpeedSeekSeconds', value)
}

/** 处理百分比快进变化 */
function handlePercentageSeekChange(event: Event) {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  rootEmit('update:percentageSeek', value)
}
</script>
