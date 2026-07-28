# 03 — 发布 Button 公共契约

**What to build:** 让应用开发者能够从 `@115master/ui` 包根获得稳定、类型安全、应用无关的 Button，并在独立 Storybook 中验证完整视觉与交互契约。为控制大范围调用迁移风险，Monkey 旧 Button 在本票完成后暂时保留，但不得成为新公共实现的依赖或转发壳。

**Blocked by:** 02 — 落地 UI 治理 skills.

**Status:** ready-for-agent

- [ ] Button 以 TSX 实现并从包根命名导出，同时公开与其公共契约直接对应的 Props 和联合类型
- [ ] Button 始终渲染原生 `<button>`，默认 `type="button"`，不支持 `<a>` 或 router-link 多态
- [ ] Button 保留 color、variant、size、shape、active、block、loading 与 disabled 能力
- [ ] link 与 Glass 仅改变 Button 视觉，不改变动作语义
- [ ] disabled 与 loading 状态阻止重复用户动作并暴露正确原生状态
- [ ] Button 通过 slots 接受文本和图标内容，UI 包不新增图标依赖
- [ ] Button 的公共几何和 Glass 样式归属 UI 公共样式，遵循 daisyUI 语义与 UI Namespace
- [ ] Button 不依赖 Monkey router、挂载节点、业务状态、文案或图标 registry
- [ ] Button 基础 Story 覆盖公共属性矩阵、slot 内容、disabled、loading 与表单中的默认 type
- [ ] play 与 a11y 测试在 light/dark Chromium 项目中只断言公开渲染和用户行为
- [ ] 消费方可仅通过正式包根与 dist 类型声明使用 Button，不需要深层导入或源码 alias
- [ ] Monkey 旧 Button 保持可构建但不转发到新实现，为下一票的一次性调用迁移提供 expand 阶段
