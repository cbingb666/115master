---
name: vue-tsx
description: 编写、重构或审查 apps/monkey 的 Vue TSX 时使用。覆盖 defineComponent + setup 渲染函数、props / emits / slots / attrs 契约、JSX 与模板语法差异、Tailwind 变体和组件导入；.vue 迁 .tsx，或 TSX 的插槽、事件、v-model、动态组件、内置组件写法存疑时同样触发。
---

# Vue TSX（apps/monkey）

## 适用边界

本 skill 规范已经选择 TSX 的实现，不自行扩大 `.vue` → `.tsx` 迁移范围。

- 文件格式选型服从 `apps/monkey/AGENTS.md`、任务目标和相邻模块现状。
- 修改存量 SFC 时，不因本 skill 被触发就顺手迁移；用户明确要求、迁移本身是任务目标或继续维护已明显受阻时再迁。
- 一旦使用 TSX，组件默认采用模块顶层 `defineComponent()`，由 `setup` 返回渲染函数，并在模块顶层导出。

## 渐进式读取

先完整阅读本文件，再根据任务读取对应资料。不要加载与任务无关的 reference。

| 任务涉及 | 必须继续读取 |
| --- | --- |
| props、emits、slots、attrs、fallthrough、组件公开类型 | [references/component-contracts.md](references/component-contracts.md) |
| 模板迁移、条件/列表、事件、v-model、动态/内置组件、ref、class、`h()`、组件导入 | [references/rendering.md](references/rendering.md) |
| 通用命名、early return、导出规则 | `.agents/STYLE_GUIDE.md` |
| 编写任何 JSX，或使用 daisyUI / Tailwind | `daisyui` skill 及其任务所需 reference |
| UI/UX 设计、修改或审查 | `ui-ux` skill |
| Glass Button、Pill、Popup、悬浮控制、媒体浮层、侧栏或 Sheet | `glass-ui` skill |
| 图标选择、注册、迁移或自定义 SVG | `icons` skill |
| 纯 UI 组件或 stories | `storybook-stories` skill；由它维护 Story 要求与完成标准 |

同时涉及组件契约和渲染时，两个本地 reference 都要读取。

## 最小骨架

```tsx
import { defineComponent } from 'vue'

const Xxx = defineComponent({
  name: 'Xxx',

  setup() {
    return () => <div />
  },
})

export default Xxx
```

- `name` 是仓库必填项，用于 devtools、错误栈和 `KeepAlive` 的 include / exclude。
- `defineComponent()` 必须位于模块顶层，组件必须导出，以保持 JSX HMR。
- setup 直接返回渲染函数；不需要的第一个参数写 `_`，不要改用 `this`。
- 组件公开契约从运行时选项推导；具体写法由 `references/component-contracts.md` 唯一维护。

## TSX 基础验证

以下命令调用 `apps/monkey/package.json` 中的现有脚本；脚本实现以 package.json 为唯一来源：

```bash
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey build
```

其他验证与完成标准服从上表路由的权威来源，不在此重复。
