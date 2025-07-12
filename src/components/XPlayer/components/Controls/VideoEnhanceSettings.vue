<template>
  <button
    ref="buttonRef"
    :class="[styles.btn.root]"
    data-tip="颜色调整"
    @click="toggleMenu"
  >
    <Icon
      class="transition-transform" :class="[
        styles.btn.icon,
        {
          'rotate-45': menuVisible,
        },
      ]"
      :icon="ICON_COLOR_ADJUST"
    />
  </button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
    :class="[styles.popup]"
  >
    <div class="card card-sm bg-neutral-800">
      <div class="card-body">
        <div class="flex justify-between items-center mb-2">
          <h3 class="card-title">
            色彩调整
          </h3>
          <button
            class="btn btn-xs btn-circle btn-ghost"
            title="重置"
            @click="videoEnhance.reset"
          >
            <Icon :icon="ICON_RESTART" class="size-6" />
          </button>
        </div>
        <div class="grid grid-rows-5 grid-flow-col gap-x-5 gap-y-2">
          <!-- 亮度 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              亮度 <span class="badge badge-sm">{{ videoEnhance.colorParams.brightness }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.brightness"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 对比度 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              对比度 <span class="badge badge-sm">{{ videoEnhance.colorParams.contrast }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.contrast"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 高光 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              高光 <span class="badge badge-sm">{{ videoEnhance.colorParams.highlights }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.highlights"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 阴影 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              阴影 <span class="badge badge-sm">{{ videoEnhance.colorParams.shadows }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.shadows"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 饱和度 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              饱和度 <span class="badge badge-sm">{{ videoEnhance.colorParams.saturation }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.saturation"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 色温 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              色温 <span class="badge badge-sm">{{ videoEnhance.colorParams.colorTemp }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.colorTemp"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 色调 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              色调 <span class="badge badge-sm">{{ videoEnhance.colorParams.hue }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.hue"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="-100"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 锐化 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              锐化 <span class="badge badge-sm">{{ videoEnhance.colorParams.sharpness }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.sharpness"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="0"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 美白强度 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              美白强度 <span class="badge badge-sm">{{ videoEnhance.colorParams.skinWhitening }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.skinWhitening"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="0"
              max="100"
              step="1"
            >
          </fieldset>

          <!-- 肤色范围 -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              肤色范围 <span class="badge badge-sm">{{ videoEnhance.colorParams.skinRange }}</span>
            </legend>
            <input
              v-model.number="videoEnhance.colorParams.skinRange"
              type="range"
              class="range range-xs range-primary [--range-fill:0] w-full"
              min="1"
              max="10"
              step="1"
            >
          </fieldset>

          <!-- 禁用HDR -->
          <fieldset class="fieldset">
            <legend class="fieldset-legend w-full">
              禁用HDR
            </legend>
            <input
              v-model="videoEnhance.disabledHDR.value"
              type="checkbox"
              class="toggle toggle-primary toggle-sm"
            >
          </fieldset>
        </div>
      </div>
    </div>
  </Popup>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { shallowRef } from 'vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { controlStyles } from '../../styles/common'
import { ICON_COLOR_ADJUST, ICON_RESTART } from '../../utils/icon'
import Popup from '../Popup/index.vue'

const styles = {
  ...controlStyles,
  popup: 'select-none',
}

const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

const { videoEnhance } = usePlayerContext()
</script>
