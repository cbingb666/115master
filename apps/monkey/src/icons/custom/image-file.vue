<template>
  <svg viewBox="0 0 24 24" fill="currentColor" :class="$props.class">
    <path d="M5 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5zm0 2h14v9.6l-3.3-3.3a1 1 0 0 0-1.4 0L11 15.6l-2.3-2.3a1 1 0 0 0-1.4 0L5 15.6V6zm3 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ class?: string }>()
</script>
