---
name: storybook-stories
description: 在 monkey 包编写 Storybook stories（组件文档）、配置 storybook，或排查 stories type-check 报错（className / JSX.IntrinsicElements / ReactNode）时使用。
---

# Storybook Stories（apps/monkey）

Storybook 10 + `@storybook/vue3-vite` + vue-tsc。启动 `pnpm -F @115master/monkey storybook`（localhost:6006）。

## 写 stories

位置：组件目录内 `Xxx.stories.ts`；无组件的纯样式演示（如 Button 的 daisyUI 元素）放 `src/stories/`。

文件结构顺序：import → meta → `export default meta` → `type Story` → stories。

### meta

- `title: 'UI/组件名'`；`component` + `satisfies Meta<typeof X>`（纯样式演示无组件，用裸 `satisfies Meta`）。
- `tags: ['autodocs']`。
- `parameters.docs.description.component`：一句话职责 + 设计要点。
- 多 story 共用的 args（如 noop 事件）放 meta 级 `args`。

### story

- `name` 用中文，场景导向（基础 / 方向 / 嵌套 overflow 容器）。
- **能用 args 就不用 render**：story 间仅 props 不同 → `args`；涉及 slot 内容、组合结构、静态演示 → `render: () => ({ components, setup, template })`。
- 事件 props 传 noop——未装 actions addon。
- story 级 `parameters.docs.description`：仅当「这个 story 验证什么」从名字看不出时写（典范：Tooltip 的 Overflow）。
- 图标：render 里 `components: { Icon }` + `setup: () => ({ I })`，template 中用 `<Icon :name="I.X" />`。

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
  args: {}, // 仅 props 差异时
}

export const Composite: Story = {
  name: '组合场景',
  render: () => ({
    components: { Xxx },
    template: `<Xxx />`, // 组合 / slot / 静态结构时
  }),
}
```

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
