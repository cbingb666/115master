# 05 — 固化治理规则并完成全量验收

**What to build:** 让维护者和后续 agents 能从 ADR 与 Storybook skill 准确理解父 Canvas、`.test()` 子项、UI／Monkey 测试矩阵和 Storybook 版本限制，并用一次跨 Storybook 验收证明全部迁移后的 Canvas 都保持 inert、显式测试和既有质量门都完整可用。

**Blocked by:** 02 — 迁移非 Dialog 的 UI 基础 Story; 03 — 迁移 Dialog 原语与服务显式测试; 04 — 建立 Monkey 显式浏览器测试切片.

**Status:** ready-for-agent

- [ ] 修订真实浏览器 Story 测试 ADR 或发布后继 ADR，记录父 Story 只呈现初始状态、交互契约附着到 `.test()` 和文件级增量迁移政策
- [ ] ADR 明确区分 UI CLI／CI 的 light、dark、reduced-motion、mobile 四项目矩阵、Manager 的 light-only compatibility workaround 与 Monkey 的单一默认 Theme project
- [ ] ADR 记录 Storybook 10.5.5 不暴露 `experimentalTestSyntax`、不采用 embed 模式，并要求每次 Storybook 升级重新验证 feature flag、Manager 项目名、静态索引和最小 `.test()` 行为
- [ ] Storybook skill 将公共交互从 `play` 路由到父 Story 的 `.test()`，并禁止用状态改变型 `play` 编排可浏览 Canvas
- [ ] Storybook skill 说明同一文件不能混用 CSF 3 与 CSF Next，迁移文件中的纯断言型 `play` 也应转为显式测试
- [ ] Storybook skill 记录 preview factory／addon annotations、UI 与 Monkey ownership、Manager／CLI 矩阵差异、inertness 回归和升级复核要求
- [ ] 全部 20 个 UI 自动交互父 Story和两个 Monkey 集成交互父 Story都进入 inertness 回归清单
- [ ] 所有迁移父 Story在至少三秒观察期内无自动 click、pointer、keydown、input、change、submit 或交互元素 focusin，且各自初始可观察 outcome 不变
- [ ] UI Manager Run tests 成功完成 light 项目；普通 UI 包级测试仍完成四个 browser projects；Monkey 包级测试完成 Node 与默认 Theme browser projects
- [ ] UI a11y error policy、Autodocs、Controls、Theme toolbar、Theme-scoped hosts 与 Monkey 应用 fixtures 全部保持可用
- [ ] 两套静态 Storybook 索引均为迁移契约提供父 Story 和不同 ID 的 `.test()` 子项，不存在重复 render、fixture 或平行测试 Story 目录
- [ ] 工作区级 lint、type-check、test、build 与双 Storybook 静态构建全部通过
- [ ] 最终代码、ADR、UI Foundation 领域语言、Storybook skill 与已发布规格保持一致

## Comments
