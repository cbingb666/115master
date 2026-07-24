---
name: glass-ui
description: apps/monkey 的 Glass 材质体系。创建或重构 Button/Pill Glass 变体、Popup、悬浮控制、媒体浮层、侧栏或 Sheet，以及修复玻璃边框、高光、阴影或多层 backdrop-filter 不一致时使用。
---

# Glass UI

把 Glass 当作**材质**，而不是装饰工具类的集合。调用层只选择场景；前景、背景、边框、内高光、阴影和背景滤镜都由材质负责。

## 步骤

1. 阅读 `../../../../apps/monkey/src/styles/glass.css` 和相关调用层。涉及 Button、Pill 或 XPlayer Popup 时，同时阅读其实现。完成标准：所有受影响表面及其内部动作都已列明。
2. 用下表给每个表面分类。完成标准：每个表面只有一种材质场景，每个内部动作只有一种交互样式。
3. 通过现有接口应用材质。完成标准：调用层不再自行拼接背景、边框、阴影或 `backdrop-*` 来模拟 Glass。
4. 验证源码、行为和 Storybook。完成标准：旧 Glass 类归零，针对性测试、type-check 和 lint 通过，并在明暗主题下检查受影响场景。

## 场景表

| 场景 | 用途 | 容器或 Pill | Button | XPlayer Popup |
| --- | --- | --- | --- | --- |
| `surface` | 现有面板内部的弱层次 | `app-glass-surface` / `variant="glass-surface"` | `variant="glass-surface"` | — |
| `inset` | Float Glass 内部的选中动作 | — | `variant="glass-inset"` | — |
| `floating` | 页面上方的控制组、菜单和紧凑弹层 | `app-glass-floating` / `variant="glass-floating"` | `variant="glass-floating"` | 默认值或 `variant="floating"` |
| `overlay` | 图片或视频上方需要稳定对比度的动作或信息 | `app-glass-overlay` / `variant="glass-overlay"` | `variant="glass-overlay"` | `variant="overlay"` |
| `panel` | 侧栏、Sheet 和大型信息弹层 | `app-glass-panel` | — | `variant="panel"` |

`app-glass-fade` 是 Glass 面板内吸顶标题的背景渐隐，只补充材质，不构成独立场景。

## 模糊档位

| 档位 | 场景 | 合成规则 |
| --- | --- | --- |
| `none` | `surface`、`inset` | 使用 `backdrop-filter: none`，不创建第二个合成层 |
| `standard` | `floating`、`overlay` | 只在最外层悬浮表面执行一次背景滤镜 |
| `strong` | `panel` | 只用于大型结构表面，不与子层模糊叠加 |

档位的具体数值只在 `glass.css` 定义。调用层不能传 blur prop、使用 `backdrop-blur-*`，也不能覆盖 saturation 或 brightness。`app-glass-fade` 只绘制渐变，不执行背景滤镜。

## 组合

- 材质和背景滤镜只放在最外层表面一次。
- 表面内的普通动作使用 `Button variant="ghost"`。
- Float Glass 内的选中项使用 `Button variant="glass-inset"`。
- 动作用 `Button`，非动作容器或链接用 `Pill`。
- 语义色使用 Button 标准颜色；颜色变化不产生新 Glass 场景。
- `glass.css` 通过 `--glass-*` 独占所有材质数值；Button 只把它们适配到 daisyUI `--btn-*`。
- 浏览器不支持背景滤镜或用户要求降低透明度时，由材质切换为更不透明的背景；调用层不写 fallback。
- 不在 hover、active 或过渡动画中切换模糊档位。

这种组合只产生一层模糊和一条连续高光，可避免 XPlayer 控件出现不透明圆片和边框不一致。

## 迁移

按场景替换旧调用：

| 旧类或组合 | 替换方式 |
| --- | --- |
| `app-glass-border` 加半透明背景 | 选择一种完整的 `app-glass-*` 材质 |
| `app-box-glass` | `app-glass-floating` |
| `app-box-glass-strong` | `app-glass-panel` |
| `app-bg-gradient-glass` | `app-glass-fade` |
| 手写 `bg-* + border + shadow + backdrop-*` | 选择一种完整材质场景 |

调用层保留几何、定位和 overflow；只把材质职责移入 Glass 体系。

## 扩展

只有承载环境发生变化时才新增场景；现有场景只是需要增强或减弱时，直接调整其材质。先更新 `glass.css`，再仅向语义适用的模块暴露场景，并在 `src/stories/Glass.stories.ts` 和受影响模块测试中覆盖。

颜色、模糊、边框、高光和阴影的具体数值只写在 `glass.css`。

## 验证

```bash
rg -n "app-box-glass|app-glass-border|app-bg-gradient-glass|liquid-glass" apps/monkey/src
rg -n "backdrop-(blur|saturate|brightness)|backdrop-filter" apps/monkey/src --glob '!**/styles/glass.css'
pnpm -F @115master/monkey test src/components/Button src/components/Pill src/components/Pagination src/components/ActionBar src/components/XPlayer/components/Controls
pnpm -F @115master/monkey type-check
pnpm -F @115master/monkey lint
pnpm -F @115master/monkey build-storybook
```

前两条命令必须没有结果。随后在 Storybook 的 Glass story 中切换明暗主题，确认外层高光连续、内容可读，ghost 动作周围没有额外的不透明透镜；`surface` 和 `inset` 的 computed `backdrop-filter` 必须是 `none`。
