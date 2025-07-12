<template>
  <div class="card card-sm bg-neutral-800">
    <div class="card-body">
      <h3 class="card-title flex justify-between">
        预览图 <span class="text-xs font-normal text-base-content/50 text-center">刷新后生效</span>
      </h3>
      <div>
        <!-- 采样间隔 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            采样间隔 (S)
          </legend>
          <div class="flex gap-2">
            <button
              v-for="interval in samplingIntervals"
              :key="interval"
              class="btn btn-sm bg-soft flex-1"
              :class="{ 'btn-primary': thumbnailSettings.samplingInterval.value === interval }"
              @click="thumbnailSettings.setSamplingInterval(interval)"
            >
              {{ interval }}
            </button>
          </div>
        </fieldset>
        <!-- 自动缓冲 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            自动缓冲
          </legend>
          <input
            type="checkbox" :checked="thumbnailSettings.autoLoadThumbnails.value"
            class="toggle toggle-sm toggle-primary"
            @change="thumbnailSettings.toggleAutoLoad"
          >
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePlayerContext } from '../../hooks/usePlayerProvide'

const { thumbnailSettings } = usePlayerContext()

/** 采样间隔选项 */
const samplingIntervals = [30, 60, 120]
</script>
