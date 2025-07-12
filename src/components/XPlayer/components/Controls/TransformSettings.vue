<template>
  <div class="card card-sm bg-neutral-800">
    <div class="card-body">
      <h3 class="card-title">
        旋转与翻转
      </h3>
      <div>
        <!-- 旋转控制 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend w-full">
            旋转 <span class="badge badge-sm">{{ transform.rotate.value }}°</span>
          </legend>
          <div class="flex gap-2">
            <button
              class="btn btn-sm join-item flex-1"
              :disabled="transform.rotate.value === -270"
              @click="transform.left"
            >
              <Icon :icon="ICON_ROTATE_LEFT" class="size-4" />
            </button>
            <button class="btn btn-sm join-item flex-1" @click="transform.normal">
              <Icon :icon="ICON_ROTATE_NORMAL" class="size-4" />
            </button>
            <button
              class="btn btn-sm join-item flex-1"
              :disabled="transform.rotate.value === 270"
              @click="transform.right"
            >
              <Icon :icon="ICON_ROTATE_RIGHT" class="size-4" />
            </button>
          </div>
        </fieldset>

        <!-- 翻转控制 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            翻转
          </legend>
          <div class="flex gap-2">
            <button
              class="btn btn-sm flex-1"
              :class="{ 'btn-primary': transform.flipX.value }"
              @click="transform.toggleFlipX"
            >
              <div class="transform rotate-90">
                <Icon :icon="ICON_FLIP_X" class="size-4" />
              </div>
              水平
            </button>
            <button
              class="btn btn-sm flex-1"
              :class="{ 'btn-primary': transform.flipY.value }"
              @click="transform.toggleFlipY"
            >
              <Icon :icon="ICON_FLIP_Y" class="size-4" />
              垂直
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import {
  ICON_FLIP_X,
  ICON_FLIP_Y,
  ICON_ROTATE_LEFT,
  ICON_ROTATE_NORMAL,
  ICON_ROTATE_RIGHT,
} from '../../utils/icon'

const { transform } = usePlayerContext()
</script>
