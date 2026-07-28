---
name: storybook-stories
description: Storybook 契约覆盖 apps/monkey 的 UI 组件。创建或修改由 props / slots / emits 驱动的组件、编写或配置 stories，或排查 story program 的 JSX / className / ReactNode 类型错误时使用。
---

# Storybook Stories

项目基线：Storybook 10、`@storybook/vue3-vite`、Vue 3、vue-tsc。

## 1. 划定 coverage unit

**Coverage unit** 是能被独立判断的最小公开视觉契约，可以是单个组件，也可以是必须组合才有意义的组件族。组件族的 story 覆盖所有成员的独有状态；只在族内产生意义的内部组件归入该 unit。

当渲染和交互能由 props、slots、emits 和轻量 fixture 驱动时，该 coverage unit 是 **storyable**。真实 store、router 或 GM API 可由稳定的 decorator 或 mock 替代时，同样纳入。

单组件的 `Xxx.stories.ts` 与组件同目录；组件族的 `Family.stories.ts` 放在共同目录；纯样式或材质演示放在 `src/stories/`。

读取实现、类型和已有 story，盘点默认值、关键 props、slots、emits，以及真实存在的状态转换和布局边界。组件涉及交互、异步状态、响应式布局、overflow、浮层、Teleport 或拖拽时，完整读取 [SCENARIOS.md](SCENARIOS.md)，把每个适用检查纳入场景集。

完成标准：每个本次修改的视觉组件都被归入独立 unit、组件族或 context-bound，并为 context-bound 项写明真实依赖；每个 storyable unit 的可见契约分支都已映射到场景，视觉与行为等价的分支合并。

## 2. 编写最小场景集

文件顺序固定为 import → meta → `export default meta` → `type Story` → stories。

### Meta

- 组件 story 使用 `component` 和 `satisfies Meta<typeof Xxx>`；纯样式演示使用 `satisfies Meta`。
- `title` 使用 `UI/组件名`；跨组件基础材质使用 `Foundations/名称`。
- 设置 `tags: ['autodocs']`。
- `parameters.docs.description.component` 用一句话写清组件职责和关键设计决策。
- 多个 story 共用的 args 放在 meta 级 `args`。
- `argTypes` 只补充类型系统无法表达的 control 选项、标签或映射，组件类型仍是契约源。

### Stories

- 导出名用英文 PascalCase，`name` 用中文场景名。
- **Args-first**：仅 props 不同时使用 `args`；slots、组合结构、交互演示或静态样式矩阵使用 `render`。
- 每个 story 保持 **hermetic**：直接打开、刷新或改变浏览顺序都会得到相同初始状态；数据来自本地 fixture 或受控 fake；定时器、监听器、store、单例和 document 改动随 story 实例初始化并清理。
- 公开 emits / callbacks 在 story 内显示结果；纯展示场景所需的占位回调使用 noop。
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

完成标准：每个映射分支都由最小 hermetic 场景集覆盖，每个场景都有唯一、可辨认的展示目的，并符合所有适用的 `SCENARIOS.md` 检查。

## 条件分支

- stories type-check 出现 `className`、`ReactNode`、`cannot be used as a JSX component`、`JSX.IntrinsicElements` 或 `*.css` 模块错误时，在修改组件或 tsconfig 前完整读取 [TYPING.md](TYPING.md)，按报错签名修复 story program。
- 修改 `.storybook/main.ts`、`.storybook/preview.ts`、主题、Teleport 或 docgen，或公开 TSX coverage unit 的 Docs 页面缺少有效 props / controls 时，完整读取 [INFRASTRUCTURE.md](INFRASTRUCTURE.md)，保留项目级运行时约束。

## 3. 验证

```bash
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey build-storybook
pnpm storybook
```

前三条命令必须退出 0。随后在 Storybook Canvas 直接打开并逐一刷新本次变更的 story，执行所有适用的 `SCENARIOS.md` 检查；主题相关组件切换浅色与深色。公开 coverage unit 还要检查 Docs 页面能否准确说明入口、成员关系和公共契约；`meta.component` 的可配置 props 必须产生可用 controls。

完成标准：三项静态验证全绿；每个变更 story 的初始状态可重复，所有适用场景已目检；公开 unit 的 Docs 契约可用；控制台保持干净，布局完整。
