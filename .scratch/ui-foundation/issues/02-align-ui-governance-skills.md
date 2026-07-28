# 02 — 落地 UI 治理 skills

**What to build:** 让后续 agent 能依据一套与真实 UI Foundation 对齐的政策设计、实现和审查 UI。UI/UX、Design Token、Glass 与 Storybook skills 应明确公共契约优先级、视觉值所有权和两套 Storybook 分工，而不在文档中复制会漂移的具体样式值。

**Blocked by:** 01 — 建立可消费的 UI Foundation 与 Theme tracer.

**Status:** resolved

- [x] UI/UX parent skill 被重写为跨项目 UI 政策与子 skill 路由，覆盖语义、焦点、响应式、反馈和 transient UI
- [x] UI 实现优先级明确为：已有公共 UI 契约、daisyUI 官方组件、Tailwind utilities、经 Token 审核的自定义 CSS
- [x] 新增 Design Token skill，定义公共 Token、内部 Token、Token 提升、daisyUI 语义复用和局部几何豁免
- [x] Design Token skill 要求 UI 源码作为具体值唯一事实来源，不复制颜色、圆角、阴影、层级、动效或材质数值
- [x] Glass skill 使用 surface、inset、floating、overlay 与 panel 场景词汇，并要求最外层单一 filter、双 Theme 检查和 Design Token 审核
- [x] Glass skill 覆盖 Button、Pill 与 Dialog panel 的使用边界，但不引用 Monkey 专属类名或失效 distortion filter
- [x] Storybook skill 能将基础 Story 路由到 UI Storybook，将应用组合路由到 Monkey Storybook
- [x] Storybook skill 要求通过 props、slots、emits、服务 options 与 outcome 覆盖公共契约，并保持 stories hermetic
- [x] Storybook skill 记录真实 Chromium、play、a11y error 与 light/dark 双项目要求，不要求首批像素快照
- [x] skills 使用 UI Foundation 领域词汇并引用源码或领域文档，不维护第二份具体 Design Token 表
- [x] 修改后的 skills 可以被后续 Button、Pill、Tooltip 与 Dialog tickets 直接执行，无互相冲突的指令

## Comments

- 2026-07-28: Rewrote the cross-project UI/UX, Glass, and Storybook governance; added the Design Tokens skill; and aligned supporting Storybook checklists with the UI Foundation versus Monkey ownership boundary.
- Validation: `pnpm type-check`, `pnpm lint`, and `pnpm test` passed. The full test suite includes the UI Storybook's light/dark Chromium checks.
