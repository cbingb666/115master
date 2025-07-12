<template>
  <div
    :class="styles.root"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
const styles = {
  root: 'absolute inset-0 flex flex-col',
}
</script>
