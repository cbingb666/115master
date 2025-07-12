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

const styles = {
  // 容器样式
  container: {
    main: 'py-8 text-base-content/60 gap-4 text-center flex flex-col',
  },
  title: 'text-2xl font-bold mb-4',
  // 文本样式
  text: {
    description: 'text-xs',
    link: 'text-yellow-400 hover:text-yellow-300 transition-colors duration-200',
  },
  // 徽章样式
  badges: {
    container: 'flex items-center justify-center gap-4 flex-wrap',
    link: 'inline-block hover:scale-105 transition-transform duration-200',
    image: 'h-5',
  },
}

const info = computed(() => {
  return {
    version: GM_info.script.version,
    author: GM_info.script.author,
    homepage: GM_info.script.homepage,
    name: GM_info.script.name,
  }
})
</script>
