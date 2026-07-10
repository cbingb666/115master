<template>
  <svg viewBox="0 0 24 24" fill="currentColor" :class="$props.class">
    <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.5l7.1-.6L12 2z" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ class?: string }>()
</script>
