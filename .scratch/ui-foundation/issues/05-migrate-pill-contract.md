# 05 — 迁移 Pill 公共契约

**What to build:** 让应用开发者从公共 UI 契约消费具有明确信息与导航语义的 Pill，并将 Monkey 全部既有用法切换到该契约。用户继续获得相同的胶囊布局与 Glass 表现，同时 Pill 不再被当作按钮动作。

**Blocked by:** 02 — 落地 UI 治理 skills.

**Status:** resolved

- [x] Pill 以 TSX 实现并从包根命名导出，同时公开与其公共契约对应的 Props 和联合类型
- [x] Pill 可以作为 span、div 或 `<a>` 呈现信息、组合布局或导航
- [x] Pill 不提供按钮动作语义；现有不符合该语义的消费点改用 Button
- [x] Pill 保留现有尺寸以及 plain 和 Glass 变体
- [x] Pill 与 daisyUI Badge 保持不同领域含义，文档和 stories 不将其描述为同义组件
- [x] Pill 通过 slots 接受内容和应用图标，不引入图标依赖
- [x] Pill 的公共几何和 Glass 样式迁入 UI 公共样式，旧应用前缀直接更名为 UI Namespace
- [x] Pill 基础 Story 在 light/dark Chromium 中覆盖容器、链接、尺寸、plain/Glass 与可访问语义
- [x] Monkey 的全部 Pill 消费通过包根与正式 dist 完成迁移
- [x] Monkey 本地 Pill 实现、基础 Story、旧测试和只服务旧实现的样式被删除
- [x] 不保留应用内 Pill 转发壳、深层兼容路径或旧 CSS 类别名
- [x] UI 与 Monkey 的类型、browser stories、静态 Storybook 和生产构建保持通过

## Comments

- 2026-07-28: Moved the complete Pill contract and public styles to `@115master/ui`, migrated every Monkey consumer to the package root, and removed the application-local implementation and compatibility paths.
- Validation: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, and both static Storybook builds passed.
