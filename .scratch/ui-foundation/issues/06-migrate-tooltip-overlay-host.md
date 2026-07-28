# 06 — 迁移 Tooltip 与 Overlay Host

**What to build:** 提供不依赖任何应用挂载节点的公共 Tooltip 与 Overlay Host。鼠标、键盘和辅助技术用户能在滚动、窄视口和主题 Teleport 场景中获得稳定的非交互补充说明，Monkey 全部提示调用直接消费公共契约。

**Blocked by:** 02 — 落地 UI 治理 skills.

**Status:** resolved

- [x] Tooltip 与 OverlayHost 以 TSX 实现并从包根命名导出，同时公开必要的 Props 和 placement 类型
- [x] Tooltip 使用 `@floating-ui/vue` 的 offset、flip、shift 与 autoUpdate 管理位置，daisyUI 只负责视觉
- [x] placement 只接受 top、right、bottom、left 四个首选方向，默认 bottom，空间不足时允许自动翻转和偏移
- [x] Tooltip 内容支持字符串 prop 与非交互 content slot；空内容不挂载浮层或建立 ARIA 关联
- [x] 浮层具有 tooltip role，锚点通过 ARIA 与其真实内容关联
- [x] Hover 默认 400ms 打开、100ms 关闭，focus 立即打开，blur 与 Escape 立即关闭，并允许单组件覆盖延迟
- [x] Tooltip 在滚动、resize 与布局变化时持续跟随锚点
- [x] Tooltip 默认 Teleport 到最近的主题作用域 Overlay Host，允许单组件覆盖 `to`，缺少 Host 时回退到 document.body
- [x] Overlay Host 与 Tooltip 不包含 Monkey DOM id、router、store 或业务状态知识
- [x] 基础 Stories 和 play 测试在 light/dark Chromium 中覆盖延迟、键盘、ARIA、空内容、四方向、边缘碰撞、滚动更新、Host 与 body fallback
- [x] Monkey 应用根提供主题作用域内的 Overlay Host，全部 Tooltip 消费切换到包根命名导出
- [x] Monkey Storybook 不再为 Tooltip 人工创建专属挂载节点，应用集成 stories 仍保持正确 Theme
- [x] Monkey 本地 Tooltip 实现、基础 Story 和专属定位代码被删除，不保留转发壳
- [x] UI 与 Monkey 的类型、browser stories、静态 Storybook 和生产构建保持通过

## Comments

- 2026-07-28: Published the theme-scoped OverlayHost and Floating UI Tooltip, migrated every Monkey Tooltip call to package-root imports, and removed the Monkey mount-node assumption and local implementation.
- Validation: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, and both static Storybook builds passed.
