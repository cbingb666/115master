# 03 — 迁移 Dialog 原语与服务显式测试

**What to build:** 让 Dialog 原语和 Dialog 服务的全部基础 Story 在浏览时保持关闭、空闲且可人工探索，同时仅在显式测试入口执行焦点、关闭策略、响应式、异步确认、Prompt、Stack 和 outcome 等真实浏览器契约。

**Blocked by:** 01 — 固化 UI 显式测试基线与 Button 回归门.

**Status:** ready-for-agent

- [ ] Dialog 原语文件整体采用 CSF Next，controlled、label-only、unmounting、close policies、sizes／responsive presentation 与 reduced-motion 六个父 Story 不再自动打开、关闭、卸载或移动焦点
- [ ] 六个 Dialog 原语场景原有的 button、Escape、backdrop、焦点恢复、生命周期、尺寸、响应式和 reduced-motion 断言全部附着到对应父 Story 的 `.test()`
- [ ] Dialog 服务文件整体采用 CSF Next，factory isolation／injection、outcomes／close reasons、errors／async confirmation、prompt keyboard／validation 与 Stack／close-all 五个父 Story 保持初始状态
- [ ] 五个 Dialog 服务场景原有的实例隔离、Host 缺失、正常 outcome、结构化关闭原因、错误处理、pending 保护、程序关闭、Prompt 键盘和 Stack 顺序契约全部由 `.test()` 显式执行
- [ ] 父 Story 与 `.test()` 继续共享各自的 render、服务实例、fixture 和可观察 outcome，不复制展示 Story 或依赖跨 Story 共享状态
- [ ] inertness 回归门覆盖本票全部十一个父 Story；至少三秒观察期内无自动用户输入事件、无打开 Dialog，所有 phase、reason、result、order 与 error outcome 保持各自初始值
- [ ] 刷新、重新进入或改变 Story 顺序后，每个 Dialog Story 都从相同初始状态开始，并正确清理 Dialog、焦点、listener 与服务实例
- [ ] 每个父 Story 与对应 `.test()` 子项都在静态索引中保持不同 ID、原有层级与文档归属
- [ ] light、dark、reduced-motion 与 mobile 四个 UI browser projects 全部发现并执行迁移后的显式测试，a11y violations 继续视为错误
- [ ] Dialog 与 Dialog 服务的 Docs、Controls、Theme-scoped host 和静态 Storybook 渲染保持正常
- [ ] 迁移不改变 Dialog 原语、Dialog 服务、Dialog Outcome、Dialog Close Reason、Prompt 或 Dialog Stack 的公共产品契约
- [ ] UI Foundation 的 type-check、目标 lint、完整包级 test、静态 Storybook build、inertness 回归与差异检查全部通过

## Comments
