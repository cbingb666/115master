---
name: icons-usage-detail
description: 集中式 Icon 组件的详细使用指南 —— 完整 API、各场景示例（基础 / 按钮 / 动态切换 / h 函数 / DOM 注入）、反模式详解、迁移到 I.* 的方法。开发者第一次接入图标、迁移旧 ICON_* 引用、DOM 注入 115 页面时调用本 skill。
---

# Icons 使用详解

> 强制约束（rule 形式）见 `.agents/rules/icons-usage.md`。
> 自定义 SVG 设计方法见 `icons-design` skill。

## 0. 优先级（必读）

**始终优先使用 ionicons**（Filled 套件，registry 中的 `ion:*` 项）。仅当 ionicons 在 [icon-sets.iconify.design/ion](https://icon-sets.iconify.design/ion/) 全量检索（含 Filled / Outline / Sharp 三套）后确认无对应语义时，才走自定义 SVG（`custom:*`）。

理由：ionicons 由 Ionic 官方维护，覆盖广、风格统一、零维护成本；自定义 SVG 需要持续做视觉一致性审计。

---

## 1. 入口

唯一入口：`@/icons`。

```ts
import { Icon, I } from '@/icons'
```

- `Icon` —— 集中式图标渲染组件。
- `I` —— 语义化常量集合（registry，从 `registry.ts` 自动推导）。

---

## 2. 组件 API 详解

### Props

| Prop    | 类型                                                       | 必填 | 默认值  | 说明                       |
| ------- | ---------------------------------------------------------- | ---- | ------- | -------------------------- |
| `name`  | `IconName`（自动从 registry 推导的字符串联合）            | ✅   | —       | 图标语义名                 |
| `size`  | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'custom'`         | ❌   | `'md'`  | 预定义尺寸档；`'custom'` 时由 className 控制 |

### 尺寸档位

| `size`     | Tailwind class | px |
| ---------- | -------------- | -- |
| `'xs'`     | `size-3.5`     | 14 |
| `'sm'`     | `size-4`       | 16 |
| `'md'`     | `size-5`       | 20 |
| `'lg'`     | `size-6`       | 24 |
| `'xl'`     | `size-7`       | 28 |
| `'custom'` | （不设尺寸类）  | 由父级 className 控制 |

### 颜色

颜色始终走 `currentColor`，通过 Tailwind 文本类控制：

```vue
<Icon name="PLAY" class="text-base-content" />
<Icon name="STAR" class="text-error" />
```

---

## 3. 使用示例

### 3.1 基础

```vue
<script setup lang="ts">
import { Icon, I } from '@/icons'
</script>

<template>
  <Icon :name="I.PLAY" />
  <Icon name="CLOSE" size="xs" class="text-base-content/70" />
  <Icon name="STAR_FILL" size="lg" class="text-error" />
</template>
```

> 两种调用方式等价：`:name="I.PLAY"` 与 `name="PLAY"` 都通过 `IconName` 类型校验。

### 3.2 在 TS 中使用（h 函数 / 字符串模板）

```ts
import { I } from '@/icons'

h(Icon, { name: I.PLAY, size: 'md' })
const icon = I.PREVIEW_ON
```

### 3.3 在按钮中

```vue
<button class="btn btn-circle btn-link text-base-content hover:text-base-content/80">
  <Icon name="PLAY" size="xl" />
</button>
```

### 3.4 动态切换图标

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@/icons'

const playing = ref(false)
const name = computed(() => (playing.value ? 'PAUSE' : 'PLAY'))
</script>

<template>
  <Icon :name="name" size="xl" />
</template>
```

---

## 4. 类型安全

- `name` prop 的合法值在**编译期**由 `IconName` 类型限定。
- 调用未在 registry 中定义的常量名会触发 TS 报错，请勿 `@ts-ignore`。
- 新增图标时必须先在 `apps/monkey/src/icons/registry.ts` 中登记，再使用。

---

## 5. DOM 注入场景（115 官方页面）

### 为什么不能用 `<Icon>` 组件

115 官方页面的 DOM 树脱离 Vue 渲染管线（通过 Tampermonkey 注入到原生页面）。Vue 组件无法挂载到非 Vue 树管理的 DOM 节点上，因此这部分必须使用 Iconify 提供的 `<iconify-icon>` Web Component。

### 正确写法

标识符仍然从 `I.*` 读取，保持单一来源：

```ts
import { I } from '@/icons'

const el = document.createElement('iconify-icon')
el.setAttribute('icon', I.PREVIEW_OFF)
el.setAttribute('noobserver', '')
container.append(el)
```

涉及文件：`apps/monkey/src/pages/home/TopHeaderMod/index.ts`、`apps/monkey/src/pages/home/TopFilePathMod/index.ts`。

---

## 6. 反模式详解

每条反模式都对应明确的"绕过代价"，见 `.agents/rules/icons-usage.md` 的反模式表。补充场景说明：

| 反模式                                                          | 场景举例                                           |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `import { Icon } from '@iconify/vue'`                           | 在新写的 .vue 文件里图省事直接 import              |
| 硬编码 Iconify 字符串                                           | `<Icon icon="material-symbols:play" />`           |
| `<icon icon="ion:play" />`                                      | 想用类似 iconify 的 API 但没意识到命名冲突         |
| `style="font-size: 24px"`                                       | 临时调整后忘记改回                                 |
| `style="color: red"`                                            | 紧急修一个视觉问题，没用语义类                     |
| `export * from './icons'`                                       | 跨包转发时图省事                                   |
| 用 emoji 替代图标                                               | 注释或 toast 文案里偶尔用 ⭐ ✅                     |

---

## 7. 迁移：从旧 `ICON_*` 到 `I.*`

### 7.1 命名映射示例

| 旧名                     | 新名                    | 备注                       |
| ------------------------ | ----------------------- | -------------------------- |
| `ICONS.ICON_PLAY`        | `I.PLAY`                | 重复语义已合并             |
| `ICONS.ICON_VOLUME_UP`   | `I.VOLUME_UP`           | 命名一致                   |
| `ICONS.ICON_SUBTITLES_OFF` | `I.SUBTITLES_OFF`      | 命名一致                   |
| `ICONS.ICON_FILE_FOLDER` | `I.FILE_FOLDER`         | 跨包引用                   |
| `ICONS.ICON_THEME_LIGHT` | `I.THEME_LIGHT`         | 主题相关                   |

### 7.2 迁移步骤

1. 在新代码中直接 `import { I } from '@/icons'`，不再使用 `ICONS.ICON_*`。
2. 把 `<Icon :icon="ICONS.ICON_xxx" />` 改为 `<Icon :name="I.XXX" />`。
3. 文件级 ESLint 自动提示未使用的 import —— 当一个文件中所有 `ICONS.ICON_*` 全部迁移后，删除 `import { ICONS }`。
4. 所有迁移完成后，删除 `apps/monkey/src/icons/legacy.ts` 与 `index.ts` 中的兼容导出。

---

## 8. 添加新图标

1. **优先 ionicons**：在 [icon-sets.iconify.design/ion](https://icon-sets.iconify.design/ion/) 中查找 Filled 风格的等价图标。
2. **在 `registry.ts` 中登记**：分组注释、命名遵循 `SCREAMING_SNAKE_CASE`。
3. **若 ionicons 无对应**：调用 `icons-design` skill 走自定义 SVG 流程。
4. **提交时附带截图**：在 PR 描述中粘贴新图标的实际渲染截图。

---

## 9. 相关文件

- `apps/monkey/src/icons/registry.ts` —— 图标常量注册表
- `apps/monkey/src/icons/icon.vue` —— 集中式 Icon 组件
- `apps/monkey/src/icons/types.ts` —— 自动推导的 `IconName` 类型
- `apps/monkey/src/icons/legacy.ts` —— 旧 `ICON_*` 兼容层（迁移完成后删除）
- `apps/monkey/src/icons/custom/` —— 自定义 SVG 变体目录
- `.agents/skills/icons-design/SKILL.md` —— 自定义图标设计方法