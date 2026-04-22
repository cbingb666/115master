<template>
  <div :class="$style.container">
    <TransitionGroup name="toast">
      <div
        v-for="t in toastQueue"
        :key="t.id"
        role="alert"
        :class="[$style.toast, $style[t.kind]]"
      >
        <span
          v-if="t.kind === 'loading'"
          class="loading loading-spinner loading-sm" :class="[$style.icon]"
        />
        <span>{{ t.message }}</span>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { toastQueue } from './toast'
</script>

<style module>
.container {
  position: fixed;
  right: 24px;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 99999;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  color: white;
  font-size: 14px;
  min-width: 220px;
  max-width: 400px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
}

.info {
  background: #3b82f6;
}
.success {
  background: #16a34a;
}
.error {
  background: #dc2626;
}
.loading {
  background: #475569;
}

.icon {
  flex-shrink: 0;
}
</style>
