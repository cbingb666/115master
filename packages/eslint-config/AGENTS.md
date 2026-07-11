# @115master/eslint-config

## 概述

monorepo 共享 ESLint 配置，基于 `@antfu/eslint-config`。

## 导出

```js
import { baseConfig, tailwindConfig } from '@115master/eslint-config'
```

| 导出 | 说明 |
|------|------|
| `baseConfig` | 基础规则，启用 formatters + vue，含自定义 member-ordering、jsdoc 转换、block-order 等 |
| `tailwindConfig` | Tailwind CSS 专用规则（`flat/recommended`），关闭 `no-custom-classname` |

## 关键规则

- **`ts/explicit-member-accessibility`** — 强制显式成员可访问性，但不要求 `public`
- **`@typescript-eslint/member-ordering`** — 成员排序
- **`vue/block-order`** — 强制 `<template>` → `<script>` → `<style>` 顺序
- **`jsdoc/convert-to-jsdoc-comments`** — 自动将 `/**` 注释转为 JSDoc（仅单行风格，仅变量/属性上下文）
- **`unicorn/prefer-number-properties`** — 关闭
- **`no-alert` / `no-console`** — 关闭

## 使用

```js
// eslint.config.js
import { baseConfig, tailwindConfig } from '@115master/eslint-config'

export default [
  ...baseConfig,
  ...tailwindConfig,
]
```

## 调试规则

仓库根目录的 `pnpm lint:inspector` 启动 `@eslint/config-inspector`，可在浏览器里逐条查看规则命中情况。规则冲突或"为什么这行报红"先来这里查。
