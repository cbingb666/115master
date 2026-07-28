# 01 — 建立可消费的 UI Foundation 与 Theme tracer

**What to build:** 建立首个可独立消费、可构建、可在真实浏览器中演示的 `@115master/ui` 垂直切片。应用开发者能够通过正式 dist exports 导入公共样式，在 UI Storybook 与 Monkey 中获得同一套 Tailwind、daisyUI、light/dark Theme、Design Token 和 Glass 基础，而不依赖 Monkey 源码或 DOM。

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `@115master/ui` 作为 workspace-private、ESM-only 包参与工作区依赖图，并声明清晰的 runtime、peer 与 development dependency 所有权
- [ ] Vite library build 生成可消费的 ESM 产物，vue-tsc 完成类型检查并生成声明，包根与公共 styles export 均通过真实 dist 工作
- [ ] 公共样式入口保留 Tailwind、daisyUI、imports 与显式 UI source 注册，由消费方构建链处理一次
- [ ] 样式内部按 Theme、Design Token、Glass 与组件扩展职责拆分，但消费方只需导入一个公共入口
- [ ] 公共样式保留完整 daisyUI 组件 CSS并继续排除 scrollbar，Monkey 未封装的 daisyUI 用法不受影响
- [ ] Theme 提供 light default、dark prefers-dark，显式 `data-theme` 优先于系统偏好
- [ ] daisyUI 已有颜色、圆角与基础尺寸语义不建立同义 UI Token；首批 UI Token 只覆盖真实缺口
- [ ] 所有非 daisyUI 公共类、变量与 data attributes 使用 UI Namespace
- [ ] Glass 基础能够在 light/dark 下演示 surface、inset、floating、overlay 与 panel 场景，且同一区域只有最外层承载 filter
- [ ] UI Storybook 可独立在 6006 启动，并通过正式 dist exports 与公共 styles export 渲染 Theme、Token 和 Glass 基础 Story
- [ ] UI Storybook 配置官方 docs、a11y 与 Vitest addons，并能在 Playwright Chromium 中运行至少一个 light/dark 双项目 smoke/play/axe 测试
- [ ] Monkey 导入 UI 公共样式后仍能叠加应用背景、页面和 overrides，现有主题切换继续生效
- [ ] UI 模块在 Node 环境安全 import，不在模块求值阶段访问 window 或 document
- [ ] UI 包的 build、type-check、test、storybook 与 clean 任务能够由工作区工具发现
