# 01 — 固化 UI 显式测试基线与 Button 回归门

**What to build:** 让维护者打开 Button 基础 Story 时始终看到可自由操作的初始 Canvas，同时可以通过 Storybook Manager 或 UI 包级测试显式执行同一 Story 附着的完整交互契约。将已验证的原型整理为正式的 UI Storybook CSF Next 基线，并用 Button 建立后续 Story 都能复用的父 Canvas inertness 回归门。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] UI Storybook 使用 preview factory，并完整注册 Docs、a11y 与 Vitest addon annotations，同时保留现有 Theme toolbar、Theme-scoped root、布局、背景和 a11y error policy
- [ ] Button 文件整体采用 CSF Next，父 Story 继续拥有唯一的 render、args、fixture、Autodocs 与 Controls 定义
- [ ] Button 的动作、键盘和原生表单契约附着到父 Story 的 `.test()`，不保留会在 Canvas 自动执行的状态改变型 `play`
- [ ] 直接打开 Button 父 Canvas 并观察至少三秒时，click、pointer、keydown、input、change、submit 与交互元素 focusin 计数均为零
- [ ] Button 父 Canvas 的 action 与 submit outcome 保持初始值，刷新或重新进入 Story 后仍得到相同状态
- [ ] 建立可扩展到后续父 Story和 Monkey host 的真实浏览器 inertness 回归机制，同时检查事件流和初始可观察 outcome
- [ ] Storybook Manager 的 Run tests 稳定执行 light 项目并通过 Button `.test()`，且父 Canvas 在显式运行前保持初始状态
- [ ] 普通 UI 包级测试和 CI 继续运行 light、dark、reduced-motion 与 mobile 四个 Chromium projects，四个项目都发现并执行 Button `.test()`
- [ ] Manager 专用运行只暴露 light 项目，普通 CLI／CI 不受该兼容分支影响且不会出现重复项目名
- [ ] 首次测试注册不会因 Storybook addons 或 Vue framework 依赖重新优化而中断
- [ ] UI 静态索引包含 Button 父 Story 和不同 ID 的 `.test()` 子项，二者共享同一展示 fixture
- [ ] Button 的 Docs、真实 Props Controls 与 a11y error 门继续工作，静态 Storybook 成功构建
- [ ] 当前 Storybook 10.5.5 配置不添加 `experimentalTestSyntax`，也不使用内部 embed 模式抑制 autoplay
- [ ] 移除原型标记并将原型改动整理为正式实现，不顺带迁移其他 Story
- [ ] UI Foundation 的 type-check、目标 lint、完整包级 test、静态 Storybook build 与差异检查全部通过

## Comments
