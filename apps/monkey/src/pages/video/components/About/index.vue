<template>
  <footer :class="styles.container.main">
    <h1 :class="styles.title">
      {{ info.name }}
    </h1>
    <div :class="styles.badges.container">
      <!-- github -->
      <a :href="info.homepage" target="_blank" :class="styles.badges.link">
        <img src="https://img.shields.io/badge/GitHub-115Master-yellow" alt="GitHub" :class="styles.badges.image">
      </a>

      <!-- version v1.0.0-beta -->
      <a :href="`https://github.com/cbingb666/115Master/releases/tag/v${info.version}`" target="_blank" :class="styles.badges.link">
        <img :src="`https://img.shields.io/badge/Version-${info.version.replace(/-/g, '.')}-green`" alt="Version" :class="styles.badges.image">
      </a>

      <!-- 作者 -->
      <a href="https://github.com/cbingb666" target="_blank" :class="styles.badges.link">
        <img :src="`https://img.shields.io/badge/Author-${info.author}-red`" alt="Author" :class="styles.badges.image">
      </a>
    </div>

    <div :class="styles.badges.container">
      <!-- license -->
      <a href="https://github.com/cbingb666/115master/blob/main/LICENSE" target="_blank" :class="styles.badges.link">
        <img src="https://img.shields.io/badge/License-MIT-green" alt="License" :class="styles.badges.image">
      </a>

      <!-- issues -->
      <a href="https://github.com/cbingb666/115master/issues" target="_blank" :class="styles.badges.link">
        <img src="https://img.shields.io/badge/Issues-red" alt="Issues" :class="styles.badges.image">
      </a>

      <!-- 常见问题 -->
      <a href="https://github.com/cbingb666/115master/discussions/categories/q-a" target="_blank" :class="styles.badges.link">
        <img src="https://img.shields.io/badge/Q&A-blue" alt="Issues" :class="styles.badges.image">
      </a>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { GM_info } from '$'
import { computed } from 'vue'
import { clsx } from '@/utils/clsx'

const styles = clsx({
  // 容器样式
  container: {
    main: 'text-base-content/60 flex flex-col gap-4 py-8 text-center',
  },
  title: 'mb-4 text-2xl font-bold',
  // 文本样式
  text: {
    description: 'text-xs',
    link: 'text-warning hover:text-warning/80 transition-colors duration-200',
  },
  // 徽章样式
  badges: {
    container: 'flex flex-wrap items-center justify-center gap-4',
    link: 'inline-block transition-transform duration-200 hover:scale-105',
    image: 'h-5',
  },
})

const info = computed(() => {
  return {
    version: GM_info.script.version,
    author: GM_info.script.author,
    homepage: GM_info.script.homepage,
    name: GM_info.script.name,
  }
})
</script>
