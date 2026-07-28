# 09 — 收缩应用样式与失效 Glass 基础设施

**What to build:** 完成 UI Foundation 与 Monkey 之间的样式所有权收缩。共享 Theme、Design Token、Glass 及核心组件几何只由 UI 包提供；Monkey 只保留应用背景、页面样式和尚未形成公共契约的 overrides，同时删除没有实际视觉作用的 Glass 基础设施。

**Blocked by:** 04 — 迁移 Monkey Button 并收缩旧所有权; 05 — 迁移 Pill 公共契约; 06 — 迁移 Tooltip 与 Overlay Host; 08 — 交付完整 Dialog 服务并完成 Monkey 迁移.

**Status:** resolved

- [x] Monkey 通过单一 UI styles export 获得 Tailwind、daisyUI、Theme、Design Token、Glass 和核心组件扩展
- [x] Monkey 不再重复定义共享 Theme、Button/Pill 几何、公共 Glass 或 UI Token
- [x] range、skeleton、input 与 textarea overrides 继续留在应用，并以能反映应用职责的样式模块命名
- [x] 应用背景 mesh、reset、scrollbar、页面布局与业务样式继续由 Monkey 拥有
- [x] 所有公共非 daisyUI 标识符合 `ui-*`、`--ui-*` 与 `data-ui-*` 规则
- [x] 全仓不再存在已迁移公共样式的旧 `app-*` 类别名或兼容定义
- [x] 同一视觉区域只有最外层 Glass 容器应用 backdrop filter，Button、Pill 与 Dialog 不产生重复滤镜
- [x] 删除未产生实际 CSS filter 效果的 distortion SVG 组件及应用根挂载
- [x] 删除未被 UI 或 Monkey 运行时代码消费的第三方液态玻璃依赖
- [x] 清理完成后 UI 包仍不依赖应用背景、router、GM API、图标 registry 或业务文案
- [x] 包根 exports 仅保留已确认的六个组件、两个服务和直接对应类型，内部实现不能通过 deep import 消费
- [x] light/dark Theme 下 Monkey 页面、核心组件与 Overlay 内容保持可读且显式 data-theme 仍优先
- [x] UI 与 Monkey 的 lint、类型检查、测试、静态 Storybook 和生产构建保持通过

## Comments

- 2026-07-29: Monkey now consumes the single public UI stylesheet, public Glass identifiers use the `ui-*` contract, and app-owned daisyUI overrides live in `daisy-overrides.css`. Removed duplicate Glass CSS, the ineffective distortion filter mount, and its unused dependency while keeping app backgrounds, reset, scrollbar, layout, and business styles local.
- Validation: `pnpm type-check`, `pnpm lint`, `pnpm test`, `pnpm build`, both static Storybook builds, and light/dark/mobile visual checks passed.
