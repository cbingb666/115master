<template>
  <component :is="svg" class="icon" :style="{ width: size, height: size, color }" />
</template>

<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  svg: string | Component
  size?: string
  color?: string
}>()
</script>

<style scoped>
.icon {
  width: 26px;
  height: 26px;
  vertical-align: middle;
  fill: currentColor;
}
</style>
