# Icons 使用规范

> 详细 API、示例、反模式场景、迁移方法见 `icons-usage-detail` skill。
> 自定义 SVG 设计方法见 `icons-design` skill。

## 入口

唯一入口：`@/icons`。`Icon` 组件 + `I.*` 语义常量。

## Props 速查

| Prop   | 类型                                      | 默认   |
| ------ | ----------------------------------------- | ------ |
| `name` | `IconName`（registry 推导的字符串联合）   | 必填   |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'custom'` | `'md'` |

尺寸档：`xs=14px` / `sm=16px` / `md=20px` / `lg=24px` / `xl=28px`，对应 Tailwind `size-3.5/4/5/6/7`；`custom` 不设尺寸类，由父级 className 控制。

## 颜色

仅 `currentColor`，通过 Tailwind 文本类（`text-base-content` / `text-error` 等）控制。禁止内联 `color`。

## 强制约束

- [ ] 所有图标使用经由 `@/icons`。
- [ ] **优先使用 ionicons**（Filled 套件 `ion:*`），仅当 ionicons 无语义对应时再走自定义 SVG。
- [ ] 新增常量须先在 `registry.ts` 登记，再使用。
- [ ] 颜色与尺寸通过 props / class，不通过 inline style。
- [ ] DOM 注入（115 官方页面）允许用 `<iconify-icon>` Web Component，但标识符须来源于 `I.*`。
- [ ] **`name` prop 必须使用 `I.*` 表达式，禁止字面量字符串**（`name="PLAY"` / `name="ERROR"` 等都违规，必须改为 `:name="I.PLAY"` / `name={I.ERROR}`）。

## 使用示例

### Vue（.vue）

```vue
<script setup lang="ts">
import { Icon, I } from '@/icons'
</script>

<template>
  <Icon :name="I.PLAY" />
  <Icon :name="I.CLOSE" size="xs" class="text-base-content/70" />
  <Icon :name="I.STAR_FILL" size="lg" class="text-error" />

  <!-- 动态切换 -->
  <Icon :name="playing ? I.PAUSE : I.PLAY" size="xl" />
</template>
```

### TSX（.tsx）

```tsx
import { Icon, I } from '@/icons'

return (
  <Icon name={I.PLAY} />
  <Icon name={I.CLOSE} size="xs" class="text-base-content/70" />
  <Icon name={I.ERROR} class="text-error" />
  <Icon name={playing ? I.PAUSE : I.PLAY} size="xl" />
)
```

## 反模式（每条都有绕过代价）

| 反模式 | 绕过代价 |
| --- | --- |
| `import { Icon } from '@iconify/vue'` | 散落使用，新增图标无法被 lint 拦截，迁移成本剧增 |
| 硬编码 Iconify 字符串（`material-symbols:xxx`、`ion:xxx`） | 无法枚举、改名要全文替换，编译期类型保护失效 |
| `<icon icon="ion:play" />` prop 名为 `icon` | 与 `@iconify/vue` 的 `icon` prop 命名冲突，绕过类型约束 |
| `style="font-size: 24px"` / `style="color: red"` | 破坏 size/color 体系，组件无法统一控制 |
| `export * from './icons'` | 违反 STYLE_GUIDE 导出规则，类型推导失效 |
| 用 emoji 替代图标 | 跨平台渲染不一致，无法跟随主题色 |
| `<Icon name="PLAY" />` 字面量字符串 | 虽然 TS 不会报错（`name: IconName` 接受字面量），但绕过了 `I.*` 集中引用；改名 / 重构时无法被 lint 拦截；违反"集中式 Icon 组件"的设计意图。**必须**改用 `:name="I.PLAY"` / `name={I.PLAY}` |

## 验证命令

```bash
cd apps/monkey && pnpm lint && pnpm type-check && pnpm build
```

必须全部通过才能提交。