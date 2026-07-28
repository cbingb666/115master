---
name: storybook-stories
description: Storybook 覆盖 apps/monkey 的 UI 组件。创建或修改由 props / slots / emits 驱动的组件、编写或配置 stories，或排查 story program 的 JSX / className / ReactNode 类型错误时使用。
---

# Storybook Stories

项目基线：Storybook 10、`@storybook/vue3-vite`、Vue 3、vue-tsc。

## 1. 划定覆盖范围

可独立展示的组件是 **storyable**：渲染和交互由 props、slots、emits 驱动，不需要真实 store、router 或 GM API。每个本次新增或修改的 storyable 组件，都在组件目录内新增或同步更新 `Xxx.stories.ts`。

依赖应用上下文的组件，只有在轻量 decorator 或 mock 能提供稳定、可重复的场景时才纳入；纯样式或材质演示放在 `src/stories/`。

读取组件实现、类型和已有 story，盘点默认值、关键 props、slots、emits，以及组件真实存在的空、加载、错误、禁用、异步、overflow 和响应式状态。选择能让这些行为产生可见差异的最小场景集。

完成标准：每个本次修改的组件都已分类；每个 storyable 组件的可见契约分支都由一个场景覆盖，或因视觉与行为无差异而明确排除。

## 2. 编写最小场景集

文件顺序固定为 import → meta → `export default meta` → `type Story` → stories。

### Meta

- 组件 story 使用 `component` 和 `satisfies Meta<typeof Xxx>`；纯样式演示使用 `satisfies Meta`。
- `title` 使用 `UI/组件名`；跨组件基础材质使用 `Foundations/名称`。
- 设置 `tags: ['autodocs']`。
- `parameters.docs.description.component` 用一句话写清组件职责和关键设计决策。
- 多个 story 共用的 args 放在 meta 级 `args`。

### Stories

- 导出名用英文 PascalCase，`name` 用中文场景名。
- **Args-first**：仅 props 不同时使用 `args`；slots、组合结构、交互演示或静态样式矩阵使用 `render`。
- 事件无可见结果时传 noop；需要验证交互时，在 story 内显示结果。项目未安装 actions addon。
- 仅当名称无法说明验证目标时，增加 `parameters.docs.description.story`。
- 使用图标时同时遵循 `icons` skill；在 `render` 中注册 `Icon`，从 `setup` 暴露 `I`，template 通过 `<Icon :name="I.X" />` 引用。
- 主题会改变组件表现时，场景必须能在工具栏的浅色与深色主题下检查。

```ts
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Xxx from './Xxx'

const meta = {
  title: 'UI/Xxx',
  component: Xxx,
  parameters: {
    docs: {
      description: {
        component: '组件职责与关键设计决策。',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Xxx>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: '基础',
  args: {},
}

export const Composite: Story = {
  name: '组合场景',
  render: () => ({
    components: { Xxx },
    template: `<Xxx>slot content</Xxx>`,
  }),
}
```

完成标准：每个选定场景都有唯一、可辨认的展示目的，story 文件符合上述结构，场景集保持最小。

## 条件分支

- stories type-check 出现 `className`、`ReactNode`、`cannot be used as a JSX component`、`JSX.IntrinsicElements` 或 `*.css` 模块错误时，在修改组件或 tsconfig 前完整读取 [TYPING.md](TYPING.md)，按报错签名修复 story program。
- 修改 `.storybook/main.ts`、`.storybook/preview.ts`、主题、Teleport 或 TSX docgen 时，完整读取 [INFRASTRUCTURE.md](INFRASTRUCTURE.md)，保留项目级运行时约束。

## 3. 验证

```bash
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey build-storybook
pnpm storybook
```

前三条命令必须退出 0。随后在 Storybook Canvas 逐一打开本次新增或修改的 story：操作交互状态；主题相关组件切换浅色与深色；响应式组件检查相关窄屏与宽屏尺寸。

完成标准：三项静态验证全绿，且每个变更 story 的默认、交互、主题和响应式适用项都已目检；控制台保持干净，布局完整。
