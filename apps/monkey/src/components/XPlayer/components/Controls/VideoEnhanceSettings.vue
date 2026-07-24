<template>
  <Button
    ref="buttonRef"
    variant="ghost"
    shape="circle"
    title="视频色彩"
    @click="toggleMenu"
  >
    <Icon
      :class="styles.btn.icon"
      :name="I.COLOR_ADJUST"
    />
  </Button>
  <Popup
    v-model:visible="menuVisible"
    :trigger="buttonRef"
    placement="top"
    :class="[styles.popup]"
  >
    <div class="card card-sm">
      <div class="card-body">
        <div class="mb-2 flex items-center justify-between">
          <h3 class="card-title">
            视频色彩
          </h3>
          <Button
            variant="ghost"
            size="xs"
            shape="circle"
            title="重置"
            @click="resetAll"
          >
            <Icon :name="I.RESTART" class="size-6" />
          </Button>
        </div>
        <div class="grid grid-flow-col grid-rows-5 gap-x-5 gap-y-2">
          <fieldset
            v-for="(value, key) in enhanceParams.values"
            :key="key"
            class="fieldset"
          >
            <legend class="fieldset-legend w-full">
              {{ ENHANCE_PARAMS_CONFIG[key].name }} <span class="badge badge-sm">{{ value }}</span>
            </legend>
            <input
              type="range"
              class="range range-xs range-primary w-full [--range-fill:0]"
              :value="value.value"
              :min="ENHANCE_PARAMS_CONFIG[key].min"
              :max="ENHANCE_PARAMS_CONFIG[key].max"
              :step="ENHANCE_PARAMS_CONFIG[key].step"
              @input="($event: Event) =>
                values[key].value = ($event.target as HTMLInputElement).valueAsNumber"
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
import { shallowRef } from 'vue'
import Popup from '@/components/XPlayer/components/Popup/index.vue'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { controlStyles } from '@/components/XPlayer/styles/common'
import { I, Icon } from '@/icons'
import { clsx } from '@/utils/clsx'
import Button from '../../../Button/Button'

const styles = clsx({
  ...controlStyles,
  popup: [
    'p-2',
    'select-none',
  ],
})

const buttonRef = shallowRef<HTMLElement>()
const menuVisible = shallowRef(false)
function toggleMenu() {
  menuVisible.value = !menuVisible.value
}

const { videoEnhance } = usePlayerContext()
const { enhanceParams, ENHANCE_PARAMS_CONFIG } = videoEnhance
const { values, resetAll } = enhanceParams
</script>
