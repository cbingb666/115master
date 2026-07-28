<template>
  <div class="card card-sm">
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
            <Button
              size="sm"
              class="flex-1"
              :disabled="transform.rotate.value === -270"
              @click="transform.left"
            >
              <Icon :name="I.ROTATE_LEFT" class="size-4" />
            </Button>
            <Button size="sm" class="flex-1" @click="transform.normal">
              <Icon :name="I.ROTATE_NORMAL" class="size-4" />
            </Button>
            <Button
              size="sm"
              class="flex-1"
              :disabled="transform.rotate.value === 270"
              @click="transform.right"
            >
              <Icon :name="I.ROTATE_RIGHT" class="size-4" />
            </Button>
          </div>
        </fieldset>

        <!-- 翻转控制 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            翻转
          </legend>
          <div class="flex gap-2">
            <Button
              size="sm"
              :color="transform.flipX.value ? 'primary' : 'default'"
              :active="transform.flipX.value"
              class="flex-1"
              @click="transform.toggleFlipX"
            >
              <Icon :name="I.FLIP_X" class="size-4" />
              水平
            </Button>
            <Button
              size="sm"
              :color="transform.flipY.value ? 'primary' : 'default'"
              :active="transform.flipY.value"
              class="flex-1"
              @click="transform.toggleFlipY"
            >
              <Icon :name="I.FLIP_Y" class="size-4" />
              垂直
            </Button>
          </div>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@115master/ui'
import { usePlayerContext } from '@/components/XPlayer/hooks/usePlayerProvide'
import { I, Icon } from '@/icons'

const { transform } = usePlayerContext()
</script>
