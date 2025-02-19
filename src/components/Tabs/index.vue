<template>
  <div class="tabs-container">
    
    <div class="tabs-content">
      <transition name="fade" mode="out-in">
        <div
          :key="modelValue"
          class="tab-panel"
          role="tabpanel"
          :id="`panel-${modelValue}`"
        >
          <slot :name="`panel-${modelValue}`"></slot>
        </div>
      </transition>
    </div>
    <div class="tabs-header" role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="index"
        class="tab-button"
        :class="{ active: modelValue === index }"
        role="tab"
        :aria-selected="modelValue === index"
        :aria-controls="`panel-${index}`"
        @click="$emit('update:modelValue', index)"
      >
        <slot :name="`tab-${index}`">{{ tab }}</slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: number;
	tabs: string[];
}>();

defineEmits<(e: "update:modelValue", value: number) => void>();
</script>

<style scoped>
.tabs-container {
  display: flex;
  width: 100%;
}

.tabs-header {
  position: relative;
  display: flex;
  display: flex;
  flex-direction: column;
  margin-left: 12px;
}

.tab-button {
  flex: 1;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 16px;
  color: #aaa;
  transition: color 0.3s ease;
  position: relative;
  z-index: 1;
}

.tab-button:hover {
  color: #3b82f6;
}

.tab-button.active {
  color: #3b82f6;
  font-weight: 500;
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  background-color: #3b82f6;
  transition: transform 0.3s ease;
}

.tabs-content {
  position: relative;
  min-height: 100px;
}

.tab-panel {
  width: 100%;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
