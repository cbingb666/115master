<template>
  <svg viewBox="0 0 24 24" :class="$props.class">
    <path d="M12 5v14M6 9l6-4 6 4M6 15l6 4 6-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ class?: string }>()
</script>
