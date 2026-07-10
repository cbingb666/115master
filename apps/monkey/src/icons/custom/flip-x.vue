<template>
  <svg viewBox="0 0 24 24" fill="currentColor" :class="$props.class">
    <path d="M5 12h14M9 6l-4 6 4 6M15 6l4 6-4 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ class?: string }>()
</script>
