# 02 — 迁移非 Dialog 的 UI 基础 Story

**What to build:** 让 Overlay Host、Tooltip、Pill 与 Theme／Glass 的基础 Story 在浏览时保持 hermetic 初始状态，同时通过附着在同一父 Story 上的显式测试继续证明浮层、键盘、焦点、Theme、Glass 和语义契约。

**Blocked by:** 01 — 固化 UI 显式测试基线与 Button 回归门.

**Status:** ready-for-agent

- [ ] Overlay Host 的 Theme-scoped target 父 Story 不再自动打开说明浮层，其目标归属和 Theme 契约由 `.test()` 显式执行
- [ ] Tooltip 的 interaction、content／empty content、placements、edge／scroll 与 overlay targets 五个父 Story 均不再自动 hover、click、Tab、Escape 或滚动
- [ ] Tooltip 的 pointer、keyboard、空内容、slot、placement、边界、滚动和 Overlay Host 契约在四个 UI browser projects 中继续通过
- [ ] Pill 文件整体采用 CSF Next，导航链接父 Story 不再自动获得焦点
- [ ] Pill 的容器、导航、尺寸和材质变体四组原有断言全部移入对应 `.test()`，同一文件不保留自动测试与显式测试两种语义
- [ ] Theme／Glass tracer 父 Story 不再自动点击或移动焦点，其 Theme、filter owner、嵌套材质和动作契约由 `.test()` 显式执行
- [ ] 所有受影响父 Story 继续复用原有 render、args、fixture、title、name、tags、Docs 与 Controls，不创建平行的测试 Story 或重复公共组件矩阵
- [ ] inertness 回归门覆盖本票全部父 Story；每个场景在至少三秒观察窗口内无自动用户输入事件，且 Tooltip／Overlay 未打开、Pill 未自动聚焦、tracer outcome 保持初始状态
- [ ] 每个迁移父 Story 与对应 `.test()` 子项都能在静态索引中被区分和发现
- [ ] light、dark、reduced-motion 与 mobile 四个 UI browser projects 全部发现并执行迁移后的显式测试，a11y violations 继续视为错误
- [ ] 至少验证一个受影响公共组件的 Docs 与 Controls，确保 preview factory annotations 和真实公共 Props 未退化
- [ ] 迁移不改变 Overlay Host、Tooltip、Pill、Theme 或 Glass 的产品行为与视觉设计
- [ ] UI Foundation 的 type-check、目标 lint、完整包级 test、静态 Storybook build、inertness 回归与差异检查全部通过

## Comments
