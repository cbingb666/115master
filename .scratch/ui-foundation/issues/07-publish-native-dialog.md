# 07 — 发布原生受控 Dialog

**What to build:** 让应用开发者能够通过公共、受控的 Dialog 原语渲染应用无关的模态界面。键盘、移动端、桌面端和减少动态效果的用户都获得正确的 top-layer、焦点、关闭策略、响应式布局和 Glass panel。

**Blocked by:** 02 — 落地 UI 治理 skills; 03 — 发布 Button 公共契约.

**Status:** resolved

- [x] Dialog 以 TSX 实现并从包根命名导出，同时公开公共 Props、事件、尺寸与关闭类型
- [x] Dialog 使用原生 `<dialog>`，由受控状态同步 showModal 与 close，不使用 div 模拟 modal
- [x] Dialog 提供正确的可访问名称、描述关联、模态语义、初始焦点、焦点约束和关闭后焦点恢复
- [x] Escape 与蒙层关闭默认启用并可独立覆盖，关闭事件能区分 escape 与 backdrop
- [x] Dialog 支持 md、lg、xl 与 full 尺寸
- [x] Dialog 在移动端从底部呈现，在 sm 及以上视口居中
- [x] Dialog 外壳使用 panel Glass，公共操作使用 UI Button，业务内容自行管理内部布局与滚动
- [x] 打开与关闭由 CSS transition 状态驱动，opened 与 closed 在真实过渡完成后结算
- [x] transition 缺失时按计算样式得到的时长安全结算，不存在固定 300ms 猜时
- [x] `prefers-reduced-motion: reduce` 下 Dialog 生命周期立即完成
- [x] 动画时长作为内部 Token，不扩张首批公共 Token
- [x] Dialog 模块在未挂载时不访问 DOM，并能在 Node 环境安全 import
- [x] 基础 Stories 和 play/a11y 测试在 light/dark Chromium 中覆盖受控状态、关闭路径、焦点、尺寸、响应式与减少动态效果
- [x] Dialog 原语不包含 Vue Router、命令式全局容器、业务文案或 Monkey DOM 假设
- [x] UI 包构建、类型声明、browser stories 和静态 Storybook 均通过正式 exports

## Comments

- 2026-07-28: Published the controlled native Dialog with responsive Glass presentation, browser-native focus and close behavior, computed transition settlement, reduced-motion support, and public-root Story coverage including a 375×667 mobile project. A late native `close` event is now ignored when it belongs to the component's own prior close cycle, so rapid reopen remains controlled.
- Validation: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, and both static Storybook builds passed.
