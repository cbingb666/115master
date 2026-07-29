# 04 — 建立 Monkey 显式浏览器测试切片

**What to build:** 让 Monkey 的应用样式组合和 App Dialog Adapter 集成 Story 在浏览时保持初始状态，并通过一个应用自有的默认 Theme Chromium project 显式执行保存、键盘、Dialog history、route marker、listener cleanup 和 outcome 契约。

**Blocked by:** 01 — 固化 UI 显式测试基线与 Button 回归门.

**Status:** ready-for-agent

- [ ] Monkey Storybook 使用 preview factory，并在保留现有 Theme toolbar、应用背景、Overlay Host、Dialog Host、应用 Teleport 集成与本地图标 registry 的前提下注册 Docs 和 Vitest annotations
- [ ] Monkey Storybook 启用 Vitest addon，并建立一个使用应用默认 Theme 的真实 Chromium browser project
- [ ] 新 browser project 与现有 Node 单元测试作为独立项目共同纳入 Monkey 包级 test，不需要隐藏的额外 CI 命令
- [ ] Monkey 不复制 UI Foundation 的 light／dark、reduced-motion 或 mobile 四项目矩阵
- [ ] Application Styles 文件采用 CSF Next，Theme composition 父 Story 的保存计数保持初始值，点击与键盘保存契约附着到 `.test()`
- [ ] App Dialog Adapter 的 history Story 文件采用 CSF Next，父 Story 保持初始内存路由、无打开 Dialog、无残留 listener，完整路由历史契约附着到 `.test()`
- [ ] 两个迁移父 Story 继续共享原有 render、应用 fixture、内存 Router、服务实例与可观察 outcome，不复制测试专用 Story
- [ ] Monkey host 的 inertness 回归覆盖两个父 Story；至少三秒观察期内无自动用户输入事件、保存次数不变、route marker 与 listener outcome 保持初始状态
- [ ] 显式测试继续验证 Application Styles 的 pointer／keyboard outcome，以及 App Dialog Adapter 的嵌套 Dialog、前进／后退、route marker、程序关闭与 listener cleanup
- [ ] 新 browser project能够基本渲染现有 Monkey Stories；若暴露非 hermetic fixture，只修复对应应用集成边界，不复制 UI Foundation mock 或基础矩阵
- [ ] 两个父 Story 和各自 `.test()` 子项在静态索引中可区分，Docs、Theme toolbar、Overlay／Dialog hosts 与应用样式继续正常
- [ ] Monkey 的 type-check、lint、完整包级 test、静态 Storybook build、inertness 回归与差异检查全部通过

## Comments
