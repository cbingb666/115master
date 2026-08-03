# 组件 Stories 规范

本规范用于编写和评审仓库内的组件 Story。它同时约束 UI Foundation 的基础 Story 与 Monkey 的应用集成 Story；两者共享编写和测试规则，但不共享所有权。

文中“必须”是合并要求，“应该”是默认选择，偏离时需要有明确理由，“可以”是可选做法。

## 目标

一个好的 Story 同时是：

- 组件某个公开状态或使用场景的可浏览文档；
- 一个确定性、可隔离渲染的最小 fixture；
- 真实浏览器中的 render、可访问性和视觉回归输入；
- 需要时，显式交互契约的唯一父 Canvas。

Story 描述公开 UI 契约，不解释组件的私有实现。

## 所有权与边界

| 类型 | 位置 | 负责证明 | 不得依赖 |
| --- | --- | --- | --- |
| UI Foundation 基础 Story | `packages/ui` | 公共组件、Theme、Token、Glass 和平台交互契约 | Monkey 路由、store、GM API、业务文案或挂载节点 |
| Monkey 组件 Story | `apps/monkey` | 应用自有组件的状态与行为 | 真实网络、非确定性宿主页面 |
| Monkey 集成 Story | `apps/monkey` | UI Foundation 与路由、store、服务或应用样式的组合 | 重复 UI Foundation 已有的基础矩阵 |

公共组件 Story 必须通过包根导入组件和公开类型，以同时证明真实消费入口；不得深层导入内部实现。

组件专属 Story 应该与组件放在同一目录。横跨多个组件的 Foundation、材质或集成场景可以放在 `src/stories` 中。不为了统一目录而单独搬迁现有 Story。

## 文件与 CSF 格式

- 文件名必须是 `<Component>.stories.ts` 或 `<Component>.stories.tsx`。
- 新 Story 文件必须使用当前 preview factory 提供的 CSF Next：`preview.meta()` 与 `meta.story()`。
- 已有 CSF 3 文件可以增量保留；单个文件不得混用 CSF 3 和 CSF Next。
- `meta.component` 必须是真实公开组件，不得为了 Controls 虚构包装组件。
- 需要扩展 Story-only args 时，使用 `preview.type<{ args: ... }>().meta()` 明确建模。
- 组件文档默认显式标记 `tags: ['autodocs', 'test']`。

当前仓库锁定 Storybook 10.5.5。不得添加该版本未暴露的 `experimentalTestSyntax`；升级 Storybook 时按 ADR-0009 重新验证。

## 层级与命名

`title` 使用稳定、可预期的层级：

- `UI/<Component>`：组件的基础契约；
- `Foundations/<Concept>`：Theme、Token、Motion、Glass 等基础概念；
- `Integrations/<Scenario>`：多个公共能力或应用环境的组合；
- `App/<Adapter>`：路由适配器等应用级契约。

Story 导出名必须使用稳定的 PascalCase 英文标识符，例如 `Default`、`Sizes`、`Disabled`。需要中文展示名或特殊字符时使用 `name`，不通过改导出名调整文案。

修改 `title` 或 Story 导出名会改变 Story ID，必须同时检查 inertness 清单、静态索引和视觉基线。

## Story 组织

一个 Story 应该回答一个清晰问题。“比较全部尺寸”是一个问题，因此可以在一个 Story 中渲染一组组件；“展示组件所有能力”不是足够聚焦的问题。

| Story 类型 | 适用条件 | 要求 |
| --- | --- | --- |
| `Default` | 所有组件 | 单个主目标，展示真实默认值，Controls 可直接操作 |
| `Variants` / `Sizes` | 存在公开视觉轴 | 每个 Story 只比较一个轴 |
| `States` | 存在 loading、disabled、selected、error 等状态 | 直接用 args 或 fixture 构造，不自动操作到该状态 |
| `Content` | 有 slot、图标、长文本、空内容或复合内容 | 覆盖会改变布局或可访问名的代表性组合 |
| `Responsive` / `Overflow` | 响应式、容器宽度或滚动是公开契约 | 使用明确容器和边界数据 |
| `Context` | 组件依赖 Theme、背景、Overlay Host 或父级材质 | 在最小但真实的上下文中展示 |
| `Behavior` / 领域场景名 | 存在点击、键盘、表单、焦点、浮层或异步契约 | 父 Canvas 保持初始状态，交互写入附着的 `.test()` |

只创建适用于当前组件的 Story。不要为了凑齐分类而生成空洞场景。
普通、低风险的 prop 变化由 `Default` 的 Controls 探索；只有具有独立文档价值、视觉差异或行为契约的状态才需要独立 Story。

文件内建议按 `Default` → 视觉轴 → Content/States → Context/Responsive → Behavior 的阅读顺序导出。

不得默认生成公开属性的全笛卡尔积。先分别覆盖每个公开轴，只在两个轴的组合产生新语义或新风险时增加代表性组合。例如 Glass variant 需要真实背景，应该与普通 variant 分开。

## Args、Controls 与 Props 文档

- `Default` 的 meta args 必须对应组件的真实默认值。如果 `undefined` 本身有语义，则保持缺省。
- args 必须实际传入当前 Story 的主目标。Controls 不得显示“可修改”但对 Canvas 无效。
- 静态对比 Story 如果不消费 args，必须设置 `parameters.controls.disable: true`。
- args 应该保持可序列化。组件 slot、VNode 或服务实例由 `render` 中的最小 fixture 承载。
- `argTypes` 用于补充 control 类型、联合值 options、语义描述和文档分组；不要在 Story 中重复定义已由组件类型提供的契约。
- 联合值列表应该使用 `satisfies readonly <PublicType>[]` 与公开类型对齐。
- 复用 Story 时优先使用 CSF Next 的 `<Story>.extend()`，不复制整个 render。

## Render 与 fixture

- Story 必须 hermetic：不访问真实网络，不依赖前一个 Story 留下的状态，不使用随机数或当前时间产生可见差异。
- fixture 只提供证明契约所需的最小容器、provider、host、mock 和数据。
- 全 Story 共享的 Theme 或应用环境放在 preview decorator；只对当前契约有意义的上下文保留在 Story render 中。
- 初始状态必须在首次渲染时直接构造。不通过自动点击、输入、路由跳转或定时器把 Canvas 推进到展示状态。
- 需要为测试暴露结果时，使用用户可观察的 DOM 结果，如 `output`、状态文本、ARIA 状态或路由标记。专用选择器按所有权使用 `data-ui-*` 或 `data-app-*` 前缀。
- 当内容本身不是契约时，使用简短、中性、确定的 fixture 文案。UI Foundation 不使用 Monkey 业务文案。

## 文档与可访问性

meta 的组件描述应该说明：

1. 组件的语义角色；
2. 何时使用；
3. 一个容易混淆的非目标或关键不变式。

只有当 Story 的上下文不能从名称和 Canvas 直接理解时，才增加 story-level description。不把 Props 表逐项复制到描述中。

每个 Story 必须在不查看实现类名的情况下获得正确的语义：

- 交互元素有正确 role 和 accessible name；
- 纯图标操作提供 `aria-label` 或等价可访问名；
- 表单控件有 label，错误和 busy/disabled 状态可观察；
- 可键盘使用的组件在行为 Story 中覆盖键盘路径；
- 装饰内容不进入可访问树。

UI Storybook 的 a11y violation 视为错误。Monkey 存量 Story 的暂时政策不授权新 Story 引入新违规。

## 父 Canvas 与显式测试

本仓库在官方通用做法之上有一条项目级强制规则：**不使用会改变可观察状态的 `play`**。

- 可浏览的父 Story 必须保持 inert：不自动点击、移动焦点、输入、提交、滚动、打开浮层或改变路由。
- 交互契约必须用 `<Story>.test()` 附着在对应父 Story 上。
- 父 Story 与 `.test()` 必须共享同一份 render、args、fixture、服务实例和初始 outcome。
- 不得另建平行的“展示 Story”、“测试 Story”、Tests 分组或重复 fixture。
- 使用 `storybook/test` 的 `userEvent`、`within`、`expect` 和 `waitFor`。优先按 role、accessible name、label 或可见文本查询。
- 断言公开可观察结果，不断言私有 ref、内部方法调用、实现类名或与契约无关的 DOM 层级。
- 当公开契约本身就是 emit/callback 且没有 UI outcome 时可以断言 spy；如果存在可见结果，优先断言可见结果。
- 异步行为等待具体可观察条件，不使用固定 sleep 猜测时序。
- 测试名描述用户可观察的契约，不描述实现过程。

新增、重命名或删除带 `.test()` 的父 Story 时，必须同步更新所属 Storybook 的 `.storybook/inertness.json`。纯展示 Story 在需要额外保证无输入副作用时也可以登记。

## 视觉回归

- 父 Story 是视觉回归的输入，`.test()` 子项不参与截图。
- 将不同公开轴拆成独立 Story，使基线失败能直接指向 Variants、Sizes、States 或 Context。
- 截图中的数据、文案、排序、容器尺寸和初始状态必须确定。
- 持续动画、随机内容和不稳定时间不得进入普通视觉 Story。Motion 本身是契约时，使用专用确定性场景。
- 主题或背景会改变契约时，必须在真实上下文中渲染，不用文字说明代替视觉证据。

有意的视觉变更必须先运行回归并逐张确认 diff，然后才串行更新共享基线。

## 最小模板

以下模板展示必需结构。Variants、States、Content 和 Behavior 按组件实际契约取舍。

```ts
import type { ExampleSize, ExampleVariant } from '@115master/ui'
import { Example } from '@115master/ui'
import { expect, userEvent, within } from 'storybook/test'
import { ref } from 'vue'
import preview from '../../../.storybook/preview'

const variants = [
  'default',
  'emphasized',
] as const satisfies readonly ExampleVariant[]

const sizes = [
  'sm',
  'md',
  'lg',
] as const satisfies readonly ExampleSize[]

const meta = preview.meta({
  title: 'UI/Example',
  component: Example,
  args: {
    variant: 'default',
    size: 'md',
    disabled: false,
  },
  argTypes: {
    variant: { control: 'select', options: variants },
    size: { control: 'inline-radio', options: sizes },
  },
  render: args => ({
    components: { Example },
    setup: () => ({ args }),
    template: '<div class="p-6"><Example v-bind="args">Example</Example></div>',
  }),
  parameters: {
    docs: {
      description: {
        component: '说明语义角色、使用时机和关键非目标。',
      },
    },
  },
  tags: ['autodocs', 'test'],
})

export const Default = meta.story({
  name: '默认',
})

export const Variants = meta.story({
  name: '变体',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Example },
    setup: () => ({ variants }),
    template: `
      <div class="flex flex-wrap gap-3 p-6">
        <Example
          v-for="variant in variants"
          :key="variant"
          :variant="variant"
        >
          {{ variant }}
        </Example>
      </div>
    `,
  }),
})

export const Behavior = meta.story({
  name: '交互契约',
  parameters: {
    controls: { disable: true },
  },
  render: () => ({
    components: { Example },
    setup() {
      const actions = ref(0)
      const act = () => actions.value += 1

      return { actions, act }
    },
    template: `
      <div class="flex items-center gap-3 p-6">
        <Example @click="act">Run action</Example>
        <output aria-live="polite" data-ui-example-actions>{{ actions }}</output>
      </div>
    `,
  }),
})

Behavior.test('executes the public action contract', async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  const action = canvas.getByRole('button', { name: 'Run action' })
  const actions = canvasElement.querySelector<HTMLOutputElement>('[data-ui-example-actions]')

  if (!actions)
    throw new Error('Example behavior story did not render its observable outcome')

  action.focus()
  await expect(action).toHaveFocus()
  await userEvent.keyboard('{Enter}')
  await userEvent.click(action)
  await expect(actions).toHaveTextContent('2')
})
```

## 反模式

评审时应该直接拒绝：

- 一个 `Contract` Story 混合 Controls、全属性矩阵、交互、表单和多种上下文；
- 每个 prop 值都拆成一个无语义的 Story，或生成全笛卡尔积；
- Controls 存在但不会改变当前 Canvas；
- 用状态改变型 `play` 自动演示；
- 复制一份专供测试的 Story 或 render；
- 依赖真实 API、日期、随机数、其他 Story 或未重置的全局状态；
- 通过 CSS 实现类、私有 DOM 层级或组件内部方法证明公开行为；
- 用固定延迟解决异步测试时序；
- 在 UI Foundation Story 中引入应用 store、路由、GM API 或业务文案。

## 合并检查清单

- [ ] Story 所有权属于正确的 UI Foundation 或 Monkey 边界
- [ ] `meta.component` 是真实组件，公共组件通过包根导入
- [ ] `Default` 使用真实默认值，Controls 对 Canvas 有效
- [ ] Story 按公开契约轴拆分，没有无意义笛卡尔积
- [ ] 静态矩阵的 Controls 已绑定或禁用
- [ ] fixture 最小、确定、hermetic，首次渲染即是目标初始状态
- [ ] 父 Canvas 不会自动产生用户输入或改变可观察状态
- [ ] 交互契约使用 `.test()` 且与父 Story 共享 fixture
- [ ] 断言使用 role、accessible name 和公开可观察结果
- [ ] 键盘、焦点、label、busy/disabled 和装饰语义按契约覆盖
- [ ] Theme、背景、Overlay、容器宽度等上下文真实且最小
- [ ] Story ID 变更已同步 inertness 清单与视觉基线
- [ ] 受影响包的 type-check、lint、test 和 Storybook 静态构建通过
- [ ] 视觉回归 diff 已逐张确认，只在变更有意时更新基线

## 验证

按改动范围至少运行：

```bash
pnpm --filter @115master/ui type-check     # UI Foundation Story
pnpm --filter @115master/ui lint
pnpm --filter @115master/ui test

pnpm --filter @115master/monkey type-check # Monkey Story
pnpm --filter @115master/monkey lint
pnpm --filter @115master/monkey test

pnpm build-storybook                       # 静态索引与两套 Storybook
pnpm test:visual                           # 意图确认后才 update
```

具体分片、并行与视觉基线更新规则见 [验证平台](./verification.md)。

## 参考

- [Storybook: How to write stories](https://storybook.js.org/docs/writing-stories)
- [Storybook: Args](https://storybook.js.org/docs/writing-stories/args)
- [Storybook: ArgTypes](https://storybook.js.org/docs/api/arg-types)
- [Storybook: Naming components and hierarchy](https://storybook.js.org/docs/writing-stories/naming-components-and-hierarchy)
- [Storybook: How to test UIs](https://storybook.js.org/docs/writing-tests)
- [Storybook: CSF Next](https://storybook.js.org/docs/api/csf/csf-next)
- [ADR-0009：Storybook 父 Canvas 与显式测试进入真实浏览器门](../adr/0009-test-ui-stories-in-a-real-browser.md)
