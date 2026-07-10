<template>
  <svg viewBox="0 0 24 24" fill="currentColor" :class="$props.class">
    <path d="M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" opacity="0.3" />
    <path d="M5 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6zm2 0v10h12V8h-7l-2-2H7z" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ class?: string }>()
</script>
