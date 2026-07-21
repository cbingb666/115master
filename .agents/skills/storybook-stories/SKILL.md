---
name: storybook-stories
description: 在 monkey 包编写 Storybook stories（组件文档）、配置 storybook，或排查 stories type-check 报错（className / JSX.IntrinsicElements / ReactNode）时使用。
---

# Storybook Stories（apps/monkey）

Storybook 10 + `@storybook/vue3-vite` + vue-tsc。启动 `pnpm -F @115master/monkey storybook`（localhost:6006）。

## 写 stories

位置：组件目录内 `Xxx.stories.ts`；无归属组件的通用样式元素放 `src/stories/`。

骨架：

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Xxx from './Xxx'

const meta = {
  title: 'UI/Xxx',
  component: Xxx,
  parameters: {
    docs: {
      description: {
        component: '组件职责与设计要点（为什么存在、解决什么）。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Xxx>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
  render: () => ({
    components: { Xxx },
    template: `<Xxx />`,
  }),
}
```

约定：

- `render` 用 template 字符串 + `components` 注册。
- 纯 props 驱动的 story 省略 render，直接给 `args`（参考 `SelectionHeader.stories.ts`）。
- 事件类 props 传 noop（`onExit: () => {}`）——未装 actions addon。
- story `name` 用中文。
- 图标走 `@/icons`（`I.*` + `Icon`）。

## react 污染（TSX 组件 stories 的最大坑）

stories import `@storybook/vue3-vite` 的类型 → 依赖链 `import 'react'` → `@types/react` 劫持全局 JSX namespace，同 program 内含 JSX 的 TSX 组件被按 React 规则检查。机制与方案权衡见 [TYPING.md](TYPING.md)。

防护设施（勿删）：

- `.storybook/react-stub.d.ts` — react 类型占位（全 any）。
- `tsconfig.stories.json`：`paths["react"]` → stub；`include` 含 `src/**/*.d.ts`（vue/jsx 全局 JSX + vite/client 的 `*.css` 声明）。

报错速查：

| 报错签名 | 修复 |
| --- | --- |
| `className` / `ReactNode` / `cannot be used as a JSX component` | 恢复 `paths["react"]` → stub |
| `TS7026: no interface 'JSX.IntrinsicElements'` / `TS2307: Cannot find module '*.css'` | 恢复 include 的 `src/**/*.d.ts` |

只有**含 JSX 语法**的组件受污染影响；`h()` 风格组件（如 Pill）免疫。

## TSX 组件要 controls / props 表 → 换 docgen

默认 `vue-docgen-api` 对 TSX 组件提取不全。需要时改 `.storybook/main.ts`：

```ts
framework: {
  name: '@storybook/vue3-vite',
  options: {
    docgen: {
      plugin: 'vue-component-meta',
      // 项目是 tsconfig references 结构，必须显式指定，否则 @/ alias 解析失败
      tsconfig: 'tsconfig.app.json',
    },
  },
},
```

## preview.ts 既有设施（勿重造）

- `#my-app`：模块级创建于 document（Teleport target，mount 前必须已存在）。
- 主题装饰器：`computed` 读 `context.globals` 才响应工具栏切换；`data-theme` 同步到 `#my-app`，Teleport 出去的组件才跟随主题。

## 验证（完成标准）

```bash
cd apps/monkey && pnpm type-check && pnpm lint && pnpm build-storybook
```

`type-check`（`vue-tsc -b`）按 references 覆盖 stories program。三绿后在 dev server 肉眼过一遍，深色 / 浅色主题都切。
