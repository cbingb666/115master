<template>
  <div class="card card-sm bg-neutral-800">
    <div class="card-body">
      <h3 class="card-title flex justify-between">
        播放
      </h3>
      <div>
        <!-- 自动播放 -->
        <fieldset class="fieldset">
          <legend class="fieldset-legend">
            自动播放
          </legend>
          <input
            type="checkbox" :checked="playSettings.autoPlay.value"
            class="toggle toggle-sm toggle-primary"
            @change="playSettings.toggleAutoPlay"
          >
          <a
            class="btn btn-link btn-xs inline-flex text-base-300"
            href="https://github.com/cbingb666/115master/discussions/206"
            target="_blank"
          >
            <Icon :icon="ICON_ERROR" />如何开启声音？
          </a>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { usePlayerContext } from '../../hooks/usePlayerProvide'
import { ICON_ERROR } from '../../utils/icon'

const { playSettings } = usePlayerContext()
</script>
